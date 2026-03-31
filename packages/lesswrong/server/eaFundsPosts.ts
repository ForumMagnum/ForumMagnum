import { z } from "zod";
import { addStaticRoute } from './vulcan-lib/staticRoutes';
import PostsRepo from "./repos/PostsRepo";

const eaFundsPostsSchema = z.object({
  slugs: z.string().nonempty().array().nonempty(),
  tag: z.string().optional(),
  limit: z.number().int().min(1).max(20),
});

export const addEAFundsPostsRoute = () => {
  addStaticRoute("/api/eafunds-posts", async (props, _req, res) => {
    try {
      const {slugs, tag, limit} = eaFundsPostsSchema.parse({
        slugs: props.query?.slugs?.split(","),
        tag: props.query?.tag,
        limit: props.query?.limit ? parseInt(props.query.limit) : 6,
      });
      const posts = await new PostsRepo().fetchEAFundsPosts(limit, slugs, tag);
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.write(JSON.stringify(posts));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Error fetching EA Funds posts:", e);
      res.statusCode = 500;
    }
    res.end();
  });
}
