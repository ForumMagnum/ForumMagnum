import { Application, Request } from "express";
import { ApiError, UnauthorizedError } from "./CrosspostErrors";
import CrosspostService from "./CrosspostService";

type RequestHandler<T extends Record<string, unknown>> = (req: Request) => Promise<T>;

/**
 * The CrosspostController is responsible for creating the API routes and verifying
 * all the input data sent to them. No implementation logic is handled here - just
 * routing and schema validation.
 */
class CrosspostController {
  constructor(
    private app: Application,
    crosspostService = new CrosspostService(),
  ) {
    this.get("/api/crosspostToken", async (req: Request) => {
      const {user} = req;
      if (!user) {
        throw new UnauthorizedError();
      }
      const token = await crosspostService.createNewCrossposterToken(user);
      return {token};
    });
  }

  private get<T extends Record<string, unknown>>(
    path: string,
    handler: RequestHandler<T>,
  ) {
    this.app.get(path, async (req, res) => {
      try {
        const result = await handler(req);
        res.json(result);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error making cross-site GET request", {path, error});
        return res
          .status(error instanceof ApiError ? error.code : 501)
          .send({error: error.message ?? "An unknown error occurred"})
      }
    });
  }
}

export default CrosspostController;
