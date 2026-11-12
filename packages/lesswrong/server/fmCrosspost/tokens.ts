import jwt, { VerifyErrors } from "jsonwebtoken";

import { InvalidPayloadError, MissingSecretError } from "./errors";

const getSecret = () => {
  const secret = (process.env.private_fmCrosspostSigningKey ?? null);
  if (!secret) {
    throw new MissingSecretError();
  }
  return secret;
}

export const verifyToken = <T extends {}>(token: string, validator: (payload: unknown) => payload is T): Promise<T> =>
  new Promise((resolve, reject) => {
    jwt.verify(token, getSecret(), (err: VerifyErrors | null, decoded?: T) => {
      if (decoded) {
        try {
          if (validator(decoded)) {
            resolve(decoded);
          } else {
            reject(new InvalidPayloadError());
          }
        } catch (e) {
          reject(e);
        }
      } else {
        reject(err);
      }
    });
  });
