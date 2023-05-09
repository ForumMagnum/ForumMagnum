import { Application, Request, Response, json } from "express";
import { isValidSearchQuery } from "./searchQuery";
import ElasticSearchService from "./ElasticSearchService";

class ElasticSearchController {
  constructor(
    app: Application,
    private searchService = new ElasticSearchService(),
  ) {
    const route = "/api/search";
    app.use(route, json({ limit: "1mb" }));
    app.post(route, this.onSearch.bind(this));
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
      res.status(400).send(e.message);
    }
  }

  private async onQuery(query: unknown) {
    if (!isValidSearchQuery(query)) {
      throw new Error("Invalid query");
    }
    try {
      return this.searchService.runQuery(query);
    } catch (e) {
      console.error("Search error:", e);
      throw e;
    }
  }
}

export default ElasticSearchController;
