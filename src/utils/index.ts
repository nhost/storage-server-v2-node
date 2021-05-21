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
