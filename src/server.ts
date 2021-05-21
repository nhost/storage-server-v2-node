import fastify from "fastify";
import { applyMigrations } from "./utils/migrations";
import fastifyMultipart from "fastify-multipart";

import { uploadObject, downloadObject } from "./utils/s3";
import { request } from "./utils/graphql-client";
import { INSERT_FILE, GET_FILE } from "./utils/graphql-queries";
import { verifyJWT, signJWT } from "./utils";

const server = fastify({ trustProxy: true });

server.register(fastifyMultipart);

server.get("/healthz", (req: any, res: any) => {
  res.code(200).send({ healthz: "ok" });
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
    dbRes = await request(INSERT_FILE, {
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

  res.code(200).send({
    fileId,
    fileName,
    pathname,
    fileMimetype: mimetype,
    fileSize: fileSize,
  });
});
server.get("/file/*", async (req: any, res: any) => {
  const pathname = req.params["*"];

  const object = await downloadObject(pathname);

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
  let dbRes: any;
  try {
    dbRes = await request(GET_FILE, {
      id: fileId,
    });
  } catch (error) {
    console.log(error);
    console.log("unable to insert file");
  }

  // if not, 404
  if (!dbRes) {
    return res.code(404).send("file not found 2");
  }

  // generate jwt token
  const token = signJWT({ pathname }, 100);

  // return
  res
    .code(200)
    .send({ pathname, token, filenameToken: `${pathname}?token=${token}` });
});

server.get("/file-signed/*", async (req: any, res: any) => {
  const pathname = req.params["*"];
  const token = req.query["token"];

  let jwtRes;
  try {
    jwtRes = verifyJWT(token);
  } catch (error) {
    return res.send(401).send("Link is no longer valid.");
  }

  //@ts-ignore
  if (jwtRes.pathname !== pathname) {
    return res.send(401).send("Incorrect token or pathname");
  }

  const object = await downloadObject(pathname);

  res
    .code(200)
    .header("Content-Type", object.ContentType)
    .header("Content-Length", object.ContentLength)
    .header("Last-Modified", object.LastModified)
    .header("ETag", object.ETag)
    .send(object.Body);
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
