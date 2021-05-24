import fastify from "fastify";
import { applyMigrations } from "./utils/migrations";
import { applyMetadata } from "./utils/metadata";
import fastifyMultipart from "fastify-multipart";

import { uploadObject, downloadObject } from "./utils/s3";
import { request } from "./utils/graphql-client";
import { INSERT_FILE, GET_FILE } from "./utils/graphql-queries";
import { verifyJWT, signJWT } from "./utils";
import { encrypt, decrypt } from "./utils/crypto";

const server = fastify({ trustProxy: true });

server.register(fastifyMultipart);

server.get("/healthz", (req: any, res: any) => {
  res.code(200).send({ healthz: "ok" });
});

server.post("/upload", async (req: any, res: any) => {
  const data = await req.file();

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
    console.error(error);
    return res.code(400).send("Unable to upload file");
  }

  const fileId = dbRes.insert_storage_files_one.id;

  // upload to S3
  const pathname = `${fileId}/${fileName}`;
  const uploadResult = await uploadObject(pathname, file, mimetype);

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
  const [fileId, fileName] = pathname.split("/");

  // see if file exists
  let dbRes: any;
  try {
    dbRes = await request(GET_FILE, {
      id: fileId,
    });
  } catch (error) {
    console.error(error);
    return res.code(404).send("File not found");
  }

  // if not, 404
  if (!dbRes) {
    return res.code(404).send("file not found 2");
  }

  // encrypt file id
  const encryptedFileId = encodeURIComponent(encrypt(fileId));

  const encryptedPathname = `${encryptedFileId}/${fileName}`;

  // generate jwt token
  const token = signJWT({ encryptedPathname }, 100);

  // return
  res.code(200).send({
    pathname: encryptedPathname,
    token,
    pathnameToken: `${encryptedPathname}?token=${token}`,
  });
});

server.get("/file-signed/*", async (req: any, res: any) => {
  const pathnameRaw = req.params["*"];
  const token = req.query["token"];
  const [encryptedFileIdEncoded, fileName] = pathnameRaw.split("/");

  let jwtRes;
  try {
    jwtRes = verifyJWT(token);
  } catch (error) {
    return res.code(401).send("Link is no longer valid.");
  }

  //@ts-ignore
  if (jwtRes.pathname !== pathname) {
    return res.code(401).send("Incorrect token or pathname");
  }

  const fileId = decrypt(decodeURIComponent(encryptedFileIdEncoded));
  const pathname = `${fileId}/${fileName}`;

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
  await applyMetadata();

  server.listen(5000, "0.0.0.0", (err: any, address: any) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Server listening at ${address}`);
  });
})();
