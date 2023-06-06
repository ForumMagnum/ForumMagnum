import { Application, Request, Response, json } from "express";
import { isValidSearchQuery } from "./SearchQuery";
import ElasticService from "./ElasticService";

class ElasticController {
  constructor(
    private searchService = new ElasticService(),
  ) {}

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
      // eslint-disable-next-line no-console
      console.error("Search error:", JSON.stringify(e, null, 2));
      res.status(400).send(e.message);
    }
  }

  private onQuery(query: unknown) {
    if (!isValidSearchQuery(query)) {
      throw new Error("Invalid query");
    }
    return this.searchService.runQuery(query);
  }

  static addRoutes(app: Application) {
    const controller = new ElasticController();
    const route = "/api/search";
    app.use(route, json({limit: "1mb"}));
    app.post(route, controller.onSearch.bind(controller));
  }
}

export default ElasticController;
