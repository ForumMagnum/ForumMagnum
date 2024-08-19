import { ZodType, z } from "zod";
import jwt, { VerifyErrors } from "jsonwebtoken";
import { InvalidPayloadError, MissingSecretError } from "../fmCrosspost/errors";
import { crosspostSigningKeySetting } from "../fmCrosspost/tokens";

class CrosspostingToken<
  Schema extends ZodType,
  Data extends z.infer<Schema>
> {
  private readonly signingOptions = {
    algorithm: "HS256",
    expiresIn: "30m",
  } as const;

  constructor(private schema: Schema) {}

  create(data: Data): Promise<string> {
    return new Promise((resolve, reject) => {
      jwt.sign(data, this.getSecret(), this.signingOptions, (err, token) => {
        if (token) {
          resolve(token);
        } else {
          reject(err);
        }
      });
    });
  }

  verify(token: string): Promise<Data> {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        this.getSecret(),
        (err: VerifyErrors | null, decoded?: Data) => {
          if (decoded) {
            const parsedData = this.schema.safeParse(decoded);
            if (parsedData.success) {
              resolve(parsedData.data);
            } else {
              reject(new InvalidPayloadError());
            }
          } else {
            reject(err);
          }
        },
      );
    });
  }

  private getSecret(): string {
    const secret = crosspostSigningKeySetting.get();
    if (!secret) {
      throw new MissingSecretError();
    }
    return secret;
  }
}

/** Token used for both connecting and unlinking crosspost accounts */
export const connectCrossposterToken = new CrosspostingToken(z.object({
  userId: z.string().nonempty(),
}));

const denormalizedPostSchema = z.object({
  draft: z.boolean(),
  deletedDraft: z.boolean(),
  title: z.string().nonempty(),
  isEvent: z.boolean(),
  question: z.boolean(),
  url: z.optional(z.string().nullable()),
  // TODO: Make non-nullable once old clients are all gone
  originalContents: z.optional(z.object({
    type: z.string().nonempty(),
    data: z.string(),
  }).nullable()),
});

export const createCrosspostToken = new CrosspostingToken(z.object({
  localUserId: z.string().nonempty(),
  foreignUserId: z.string().nonempty(),
  postId: z.string().nonempty(),
}).and(denormalizedPostSchema));

export const updateCrosspostToken = new CrosspostingToken(z.object({
  postId: z.string().nonempty(),
}).and(denormalizedPostSchema));
