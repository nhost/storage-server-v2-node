import fastify from "fastify";
import { applyMigrations } from "./utils/migrations";
import fastifyMultipart from "fastify-multipart";
import { v4 as uuidv4 } from "uuid";

import { uploadObject } from "./utils/s3";
import { request } from "./utils/graphql-client";
import { insertFile } from "./utils/graphql-queries";

const server = fastify();

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
  const filename = req.headers.filename || originalFilename;

  // generate accessToken
  const accessToken = uuidv4();

  // add to `storage.files`
  try {
    await request(insertFile, {
      object: {
        access_token: accessToken,
        filename,
        mimetype,
        size: 2,
        uploaded_by_ip_address: "1.2.3.4",
      },
    });
  } catch (error) {
    console.log(error);
    console.log("unable to insert file");
  }

  // upload to S3
  const key = `${accessToken}/${filename}`;
  const uploadResult = await uploadObject(key, file, mimetype);

  console.log({ uploadResult });

  res.code(200).send({ pong: "it worked 2!" });
});
server.get("/object/*", async (req: any, res: any) => {
  console.log("get object");
  console.log(req.params);
  res.code(200).send({ pong: "get okok" });
});

(async () => {
  console.log(JSON.stringify(process.env, null, 2));

  await applyMigrations();

  server.listen(5000, "0.0.0.0", (err: any, address: any) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Server listening at ${address}`);
  });
})();
