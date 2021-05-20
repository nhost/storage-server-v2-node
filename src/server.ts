import fastify from "fastify";
import { applyMigrations } from "./utils/migrations";
import fastifyMultipart from "fastify-multipart";
import { v4 as uuidv4 } from "uuid";

import { uploadObject, downloadObject } from "./utils/s3";
import { request } from "./utils/graphql-client";
import { insertFile } from "./utils/graphql-queries";

const server = fastify({ trustProxy: true });

server.register(fastifyMultipart);

server.get("/healthz", (request: any, reply: any) => {
  reply.code(200).send({ pong: "it worked 2!" });
});

server.post("/upload", async (req: any, res: any) => {
  const data = await req.file();

  console.log(req.headers);

  const { filename: originalFilename, mimetype, file } = data;

  // use specified filename from haders
  // or original filename
  const fileName = req.headers.filename || originalFilename;

  const fileSize = file._readableState.length;

  // add to `storage.files`
  let dbRes: any;
  try {
    dbRes = await request(insertFile, {
      object: {
        name: fileName,
        mimetype,
        size: fileSize,
        uploaded_by_ip_address: req.ip,
      },
    });
  } catch (error) {
    console.log(error);
    console.log("unable to insert file");
  }

  const fileId = dbRes.insert_storage_files_one.id;

  // upload to S3
  const pathname = `${fileId}/${fileName}`;
  const uploadResult = await uploadObject(pathname, file, mimetype);

  console.log({ uploadResult });

  res.code(200).send({ pathname, mimetype, size: fileSize });
});
server.get("/file/*", async (req: any, res: any) => {
  const pathname = req.params["*"];

  console.log({ pathname });

  const object = await downloadObject(pathname);

  console.log(object);
  // res.set('Content-Length', headObject.ContentLength?.toString())
  res
    .code(200)
    .header("Content-Type", object.ContentType)
    .header("Content-Length", object.ContentLength)
    .header("Last-Modified", object.LastModified)
    .header("ETag", object.ETag)
    .send(object.Body);
});

server.get("/generate-signed-url/*", async (req: any, res: any) => {
  const pathname = req.params["*"];
  console.log({ pathname });
  const [fileId, fileName] = pathname.split("/");
  console.log({ fileId, fileName });

  // see if file exists

  // if not, 404

  // generate jwt token
  const token = "";

  // return

  res
    .code(200)
    .send({ pathname, token, filenameToken: `${pathname}?token=${token}` });
});

server.get("/file-signed/*", async (req: any, res: any) => {
  const filepath = req.params["*"];
  const token = req.query["token"];
  res.send("ok");
});

(async () => {
  await applyMigrations();

  server.listen(5000, "0.0.0.0", (err: any, address: any) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Server listening at ${address}`);
  });
})();
