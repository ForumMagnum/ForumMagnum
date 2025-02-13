import { Application, Request, Response, json } from "express";
import ElasticService from "./ElasticService";
import { UsersRepo } from "../../repos";
import uniq from "lodash/uniq";
import { SearchOptions, SearchQuery, queryRequestSchema } from "@/lib/search/NativeSearchClient";

const defaultSearchOptions: SearchOptions = {
  emptyStringSearchResults: "default"
};

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
    let searchOptions: SearchOptions;
    let queries: SearchQuery[] = [];
    
    const parsedBody = queryRequestSchema.safeParse(body);
    if (!parsedBody.success) {
      res.status(400).send("Expected an array of queries or an object with options");
      return;
    }
    const parsedRequest = parsedBody.data;
    
    
    if (Array.isArray(parsedRequest)) {
      searchOptions = defaultSearchOptions
      queries = body;
    } else if ('queries' in parsedRequest) {
      searchOptions = body.options ?? defaultSearchOptions;
      queries = body.queries;
    }

    try {
      const results = await Promise.all(queries.map(q =>
        this.searchService.runQuery(q, searchOptions)));
      for (const result of results) {
        const resultIds = result.hits.map(r=>r._id);
        if (uniq(resultIds).length !== resultIds.length) {
          // eslint-disable-next-line no-console
          console.error(`Search result set contained duplicate entries`);
        }
      }
      res.status(200).send(results);
    } catch (e) {
      this.handleError(res, e);
    }
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
