import { DatabaseServerSetting } from "../databaseSettings";
import jwt, { VerifyErrors } from "jsonwebtoken";
import { MissingSecretError } from "./errors";

const crosspostSigningKeySetting = new DatabaseServerSetting<string|null>("fmCrosspostSigningKey", null);

const getSecret = () => {
  const secret = crosspostSigningKeySetting.get();
  if (!secret) {
    throw new MissingSecretError();
  }
  return secret;
}

const jwtSigningOptions = {
  algorithm: "HS256",
  expiresIn: "30m",
} as const;

export const signToken = <T extends {}>(payload: T): Promise<string> =>
  new Promise((resolve, reject) => {
    jwt.sign(payload, getSecret(), jwtSigningOptions, (err, token) => {
      if (token) {
        resolve(token);
      } else {
        reject(err);
      }
    });
  });

export const verifyToken = <T extends {}>(token: string, validator: (payload: unknown) => payload is T): Promise<T> =>
  new Promise((resolve, reject) => {
    jwt.verify(token, getSecret(), (err: VerifyErrors | null, decoded?: T) => {
      if (decoded) {
        try {
          validator(decoded);
          resolve(decoded);
        } catch (e) {
          reject(e);
        }
      } else {
        reject(err);
      }
    });
  });
