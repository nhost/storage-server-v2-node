import crypto from "crypto";
import { ENCRYPTION_KEY } from "./config";

const IV = "5183666c72eec9e4";

export function encrypt(text: string) {
  let cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, IV);
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");
  return encrypted;
}

export function decrypt(encrypted: string) {
  let decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, IV);
  let decrypted = decipher.update(encrypted, "base64", "utf8");
  return decrypted + decipher.final("utf8");
}
