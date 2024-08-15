import { Application, Request, Response, json } from "express";
import { ApiError, UnauthorizedError } from "../fmCrosspost/errors";
import { FMCrosspostRoute, generateTokenRoute } from "@/lib/fmCrosspost/routes";
import { ZodType, z } from "zod";
import { validateCrosspostingKarmaThreshold } from "../fmCrosspost/helpers";
import { connectCrossposterToken } from "./tokens";

const onRequestError = (
  req: Request,
  res: Response,
  routePath: string,
  status: number,
  message: string,
  error?: AnyBecauseIsInput,
) => {
  const errorCode = error instanceof ApiError ? error.code : undefined;
  // eslint-disable-next-line no-console
  console.error("Crossposting error:", message, {
    body: req.body,
    routePath,
    status,
    errorCode,
    error,
  });
  return res.status(status).send({ error: message, errorCode });
}

const addHandler = <
  RequestSchema extends ZodType,
  ResponseSchema extends ZodType,
  RequestData extends z.infer<RequestSchema>,
  ResponseData extends z.infer<ResponseSchema>,
>(
  app: Application,
  route: FMCrosspostRoute<RequestSchema, ResponseSchema, RequestData, ResponseData>,
  requestHandler: (user: DbUser, requestData: RequestData) => Promise<ResponseData>,
) => {
  const path = route.getPath();
  app.use(path, json({ limit: "1mb" }));
  app.post(path, async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedError();
    }

    const parsedResult = route.getRequestSchema().safeParse(req.body);
    if (!parsedResult.success) {
      return onRequestError(req, res, path, 400, "Invalid cross-site request body");
    }

    let response: ResponseData;
    try {
      response = await requestHandler(user, parsedResult.data);
    } catch (error) {
      const message = error.message ?? "Invalid cross-site request body";
      // Return a 200 to avoid this triggering a health check failure,
      // the error is still handled on the server making the request
      return onRequestError(req, res, path, 200, message, error);
    }

    const parsedResponse = route.getResponseSchema().safeParse(response);
    if (!parsedResponse.success) {
      // Return a 200 to avoid this triggering a health check failure,
      // the error is still handled on the server making the request
      return onRequestError(req, res, path, 200, "Invalid cross-site response body");
    }

    return res.status(200).send(parsedResponse.data);
  });
}

export const addV2CrosspostHandlers = (app: Application) => {
  addHandler(
    app,
    generateTokenRoute,
    async function generateTokenCrosspostHandler(user, _body) {
      validateCrosspostingKarmaThreshold(user);
      const token = await connectCrossposterToken.create({
        userId: user._id,
      });
      return { token };
    },
  );
}
