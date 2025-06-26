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
  },
  callback: async (context, limit, args): Promise<DbPost[]> => {
    if (!hasKeywordAlerts) {
      throw new Error("Keyword alerts not enabled");
    }

    if (!args) {
      throw new Error("Missing args");
    }

    const {keyword, startDate} = args;
    if (!keyword || typeof keyword !== "string") {
      throw new Error("Invalid keyword");
    }
    if (!(startDate instanceof Date)) {
      throw new Error("Invalid startDate");
    }

    const postIds = await fetchPostIdsForKeyword(keyword, startDate);
    const posts = await context.loaders.Posts.loadMany(postIds.slice(0, limit));
    return posts.filter(isValidPost);
  },
});

export const keywordAlertsQueryHandlers = Query;
export const keywordAlertsTypeDefs = typeDefs;
