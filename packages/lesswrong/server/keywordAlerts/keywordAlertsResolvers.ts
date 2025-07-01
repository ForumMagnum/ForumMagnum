import { hasKeywordAlerts } from "@/lib/betas";
import { createPaginatedResolver } from "../resolvers/paginatedResolver";
import { fetchPostIdsForKeyword } from "./keywordSearch";

const isValidPost = (postOrError: DbPost | Error): postOrError is DbPost =>
  !(postOrError instanceof Error) && !!postOrError._id;

const { Query, typeDefs } = createPaginatedResolver({
  name: "KeywordAlerts",
  graphQLType: "Post",
  args: {
    keyword: "String!",
    startDate: "Date!",
    endDate: "Date!",
  },
  callback: async (context, limit, args): Promise<DbPost[]> => {
    if (!hasKeywordAlerts) {
      throw new Error("Keyword alerts not enabled");
    }

    if (!args) {
      throw new Error("Missing args");
    }

    const {keyword, startDate, endDate} = args;
    if (!keyword || typeof keyword !== "string") {
      throw new Error("Invalid keyword");
    }
    if (!(startDate instanceof Date)) {
      throw new Error("Invalid startDate");
    }
    if (!(endDate instanceof Date)) {
      throw new Error("Invalid endDate");
    }

    const postIds = await fetchPostIdsForKeyword(keyword, startDate, endDate);
    const posts = await context.loaders.Posts.loadMany(postIds.slice(0, limit));
    const validPosts = posts.filter(isValidPost);
    return validPosts.sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime());
  },
});

export const keywordAlertsQueryHandlers = Query;
export const keywordAlertsTypeDefs = typeDefs;
