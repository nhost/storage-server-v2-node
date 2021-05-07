import AWS, { S3 } from "aws-sdk";

export function initClient() {
  return new AWS.S3({
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
    endpoint: process.env.S3_ENDPOINT,
    s3ForcePathStyle: true,
    signatureVersion: "v4",
    sslEnabled: false,
  });
}

// export const client = initClient();

export async function uploadObject(
  key: string,
  body: NodeJS.ReadableStream,
  contentType: string
): Promise<any> {
  // * Create or update the object

  const client = initClient();

  const upload_params = {
    Bucket: "nhost",
    Key: key,
    Body: body,
    ContentType: contentType,
  };

  const data = await client.upload(upload_params).promise();
  return data;
}
