import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";
import PostViews from "../../lib/collections/postViews/collection";

class PostViewsRepo extends AbstractRepo<"PostViews"> {
  constructor() {
    super(PostViews);
  }

  // async getEarliestPostTime(): Promise<Date> {
  //   const result = await this.oneOrNone(`
  //     -- PostsRepo.getEarliestPostTime
  //     SELECT "postedAt" FROM "Posts"
  //     WHERE ${getViewablePostsSelector()}
  //     ORDER BY "postedAt" ASC
  //     LIMIT 1
  //   `);
  //   return result?.postedAt ?? new Date();
  // }
}

recordPerfMetrics(PostViewsRepo);

export default PostViewsRepo;
