import { Application, Request, Response, json } from "express";
import { isValidSearchQuery } from "./SearchQuery";
import ElasticService from "./ElasticService";
import { UsersRepo } from "../../repos";

class ElasticController {
  constructor(
    private searchService = new ElasticService(),
  ) {}

  private handleError(res: Response, error: Error) {
    // eslint-disable-next-line no-console
    console.error("Search error:", error, JSON.stringify(error, null, 2));
    res.status(400).send(error.message ?? "An error occurred");
  }

  private async onSearch(req: Request, res: Response) {
    const {body} = req;
    if (!Array.isArray(body)) {
      res.status(400).send("Expected an array of queries");
      return;
    }
    try {
      const results = await Promise.all(body.map(this.onQuery.bind(this)));
      res.status(200).send(results);
    } catch (e) {
      this.handleError(res, e);
    }
  }

  private onQuery(query: unknown) {
    if (!isValidSearchQuery(query)) {
      throw new Error("Invalid query");
    }
    return this.searchService.runQuery(query);
  }

  private async onSearchUserFacets(req: Request, res: Response) {
    const {body} = req;
    if (!body.facetField || !body.query) {
      res.status(400).send("Invalid query");
      return;
    }
    try {
      const repo = new UsersRepo();
      const hits = await repo.searchFacets(body.facetField, body.query);
      res.status(200).send({hits});
    } catch (e) {
      this.handleError(res, e);
    }
  }

  static addRoutes(app: Application) {
    const controller = new ElasticController();

    const searchRoute = "/api/search";
    app.use(searchRoute, json({limit: "1mb"}));
    app.post(searchRoute, controller.onSearch.bind(controller));

    const facetRoute = "/api/search/userFacets";
    app.use(facetRoute, json({limit: "1kb"}));
    app.post(facetRoute, controller.onSearchUserFacets.bind(controller));
  }
}

export default ElasticController;
