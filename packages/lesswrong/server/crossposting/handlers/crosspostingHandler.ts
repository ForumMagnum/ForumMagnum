import { ZodType, z } from "zod";
import { Application, Request, Response, json } from "express";
import { ApiError, UnauthorizedError } from "../../fmCrosspost/errors";

export class CrosspostingHandler<
  RequestSchema extends ZodType,
  ResponseSchema extends ZodType,
  RequestData extends z.infer<RequestSchema>,
  ResponseData extends z.infer<ResponseSchema>,
> {
  constructor(private config: {
    routeName: string,
    requestSchema: RequestSchema,
    responseSchema: ResponseSchema,
    requestHandler: (user: DbUser, requestData: RequestData) => Promise<ResponseData>,
  }) {}

  private onError(
    req: Request,
    res: Response,
    status: number,
    message: string,
    error?: AnyBecauseIsInput,
  ) {
    const errorCode = error instanceof ApiError ? error.code : undefined;
    // eslint-disable-next-line no-console
    console.error("Crossposting error:", message, {
      body: req.body,
      routeName: this.config.routeName,
      status,
      errorCode,
      error,
    });
    return res.status(status).send({ error: message, errorCode });
  }

  private async handle(req: Request, res: Response) {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedError();
    }

    const {requestSchema, responseSchema, requestHandler} = this.config;

    const parsedResult = requestSchema.safeParse(req.body);
    if (!parsedResult.success) {
      return this.onError(req, res, 400, "Invalid cross-site request body");
    }

    let response: ResponseData;
    try {
      response = await requestHandler(user, parsedResult.data);
    } catch (error) {
      const message = error.message ?? "Invalid cross-site request body";
      // Return a 200 to avoid this triggering a health check failure,
      // the error is still handled on the server making the request
      return this.onError(req, res, 200, message, error);
    }

    const parsedResponse = responseSchema.safeParse(response);
    if (!parsedResponse.success) {
      // Return a 200 to avoid this triggering a health check failure,
      // the error is still handled on the server making the request
      return this.onError(req, res, 200, "Invalid cross-site response body");
    }

    return res.status(200).send(parsedResponse.data);
  }

  private getRoutePath() {
    return `/api/v2/${this.config.routeName}`;
  }

  addRoute(app: Application) {
    const routePath = this.getRoutePath();
    app.use(routePath, json({ limit: "1mb" }));
    app.post(routePath, this.handle.bind(this));
  }
}
