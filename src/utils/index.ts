import jwt from "jsonwebtoken";
import { JWT_SECRET } from "./config";

export function verifyJWT(token: string): string | object {
  return jwt.verify(token, JWT_SECRET);
}

export function signJWT(
  payload: string | object | Buffer,
  expiresIn: string | number
): string | object {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function base64urlencode(text: string): string {
  return text
    .replace(/\+/g, "-") // Convert '+' to '-'
    .replace(/\//g, "_") // Convert '/' to '_'
    .replace(/=+$/, ""); // Remove ending '='
}

export function base64urldecode(text: string): string {
  // Add removed at end '='
  text += Array(5 - (text.length % 4)).join("=");

  return text
    .replace(/\-/g, "+") // Convert '-' to '+'
    .replace(/\_/g, "/"); // Convert '_' to '/'
}
