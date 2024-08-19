import { ZodType, z } from "zod";

export class FMCrosspostRoute<
  RequestSchema extends ZodType,
  ResponseSchema extends ZodType,
  RequestData extends z.infer<RequestSchema>,
  ResponseData extends z.infer<ResponseSchema>,
> {
  constructor(private config: {
    routeName: string,
    requestSchema: RequestSchema,
    responseSchema: ResponseSchema,
  }) {}

  getRequestSchema() {
    return this.config.requestSchema;
  }

  getResponseSchema() {
    return this.config.responseSchema;
  }

  getPath() {
    return `/api/v2/crosspost/${this.config.routeName}`;
  }

  async makeRequest(data: RequestData): Promise<ResponseData> {
    const parsedData = this.config.requestSchema.parse(data);
    const response = await fetch(this.getPath(), {
      method: "POST",
      body: JSON.stringify(parsedData),
    });
    const result = await response.json();
    if (typeof result?.error === "string") {
      throw new Error(result.error);
    }
    return this.config.responseSchema.parse(result);
  }
}

export const generateTokenRoute = new FMCrosspostRoute({
  routeName: "generateToken",
  requestSchema: z.any(),
  responseSchema: z.object({ token: z.string().nonempty() }),
});

export const connectCrossposterRoute = new FMCrosspostRoute({
  routeName: "connectCrossposter",
  requestSchema: z.object({
    token: z.string().nonempty(),
    localUserId: z.string().nonempty(),
  }),
  responseSchema: z.object({
    foreignUserId: z.string().nonempty(),
    localUserId: z.string().nonempty(),
    status: z.enum(["connected"]),
  }),
});

export const unlinkCrossposterRoute = new FMCrosspostRoute({
  routeName: "unlinkCrossposter",
  requestSchema: z.object({
    token: z.string().nonempty(),
  }),
  responseSchema: z.object({
    status: z.enum(["unlinked"]),
  }),
});

export const createCrosspostRoute = new FMCrosspostRoute({
  routeName: "crosspost",
  requestSchema: z.object({
    token: z.string().nonempty(),
  }),
  responseSchema: z.object({
    postId: z.string().nonempty(),
    status: z.enum(["posted"]),
  }),
});

export const updateCrosspostRoute = new FMCrosspostRoute({
  routeName: "updateCrosspost",
  requestSchema: z.object({
    token: z.string().nonempty(),
  }),
  responseSchema: z.object({
    status: z.enum(["updated"]),
  }),
});
