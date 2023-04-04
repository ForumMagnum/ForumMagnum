import { Application, Request, Response, json } from "express";
import { isPostgresSearchQuery } from "./PostgresSearchQuery";
import PostgresSearchService from "./PostgresSearchService";

class PostgresSearchController {
  private searchService: PostgresSearchService;

  constructor(app: Application) {
    this.searchService = new PostgresSearchService();
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
    if (!isPostgresSearchQuery(query)) {
      throw new Error("Invalid query");
    }
    return this.searchService.runQuery(query);
  }
}

export default PostgresSearchController;
