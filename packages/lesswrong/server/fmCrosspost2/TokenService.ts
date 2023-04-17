import jwt, { VerifyErrors } from "jsonwebtoken";
import { DatabaseServerSetting } from "../databaseSettings";
import { InvalidPayloadError, MissingSecretError } from "./CrosspostErrors";
import { ZodError } from "zod";

// TODO: This doesn't need to be exported anymore when we remove the old
// crossposting implementation
export const crosspostSigningKeySetting = new DatabaseServerSetting<string | null>(
  "fmCrosspostSigningKey",
  null,
);

/**
 * Crossposting requires sending messages between API endpints on the two servers.
 * In order to verify that the sender is actually the other server and not just a
 * random user using `fetch` we encode the data in a cryptographically signed JWT.
 * The secret should be the same for both sites and should be kept secure - a user
 * with the secret could post arbitrary posts _by arbitrary authors_ on either
 * site.
 *
 * Note that the data inside the JWT _is_ readable by anybody with access to it
 * without needing to obtain the secret - it is not encrypted. The JWT just allows
 * us to be sure that the data was created by who we expect to have created it, and
 * that it has not been tampered with over the wire.
 */
class TokenService {
  private readonly jwtSigningOptions = {
    algorithm: "HS256",
    expiresIn: "30m",
  } as const;

  constructor(
    /**
     * Specify a custom signing secret to use - defaults to the server setting if
     * none is provided. This is just for testing purposes.
     */
    private customSecret?: string,
  ) {}

  /**
   * Encode the provided JSON blob into a signed JWT string.
   */
  encode<T extends {}>(payload: T): Promise<string> {
    return new Promise((resolve, reject) => {
      const secret = this.getSecret();
      jwt.sign(payload, secret, this.jwtSigningOptions, (err, token) => {
        if (token) {
          resolve(token);
        } else {
          reject(err);
        }
      });
    });
  }

  /**
   * Decode a signed JWT into the JSON payload it contains. The parser ensures
   * that it matches the expected schema. Generally this is obtained by creating
   * an object with zod and then using the `.parse` method of the resulting
   * validator.
   */
  decode<T extends Record<string, unknown>>(
    token: string,
    parser: (payload: unknown) => T,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const secret = this.getSecret();
      jwt.verify(token, secret, (err: VerifyErrors | null, decoded?: object) => {
        if (decoded) {
          try {
            resolve(parser(decoded));
          } catch (e) {
            reject(e instanceof ZodError ? new InvalidPayloadError() : e);
          }
        } else {
          reject(err);
        }
      });
    });
  }

  private getSecret() {
    const secret = this.customSecret ?? crosspostSigningKeySetting.get();
    if (!secret) {
      throw new MissingSecretError();
    }
    return secret;
  }
}

export default TokenService;
