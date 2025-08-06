import gql from 'graphql-tag';
import { hasKeywordAlerts } from "@/lib/betas";
import { createPaginatedResolver } from "../resolvers/paginatedResolver";
import { fetchContentForKeyword } from "./keywordSearch";

const keywordAlertTypeDef = gql`
  type KeywordAlert {
    _id: String!
    post: Post
    comment: Comment
  }
`;

const { Query, typeDefs } = createPaginatedResolver({
  name: "KeywordAlerts",
  graphQLType: "KeywordAlert",
  args: {
    keyword: "String!",
    startDate: "Date!",
    endDate: "Date!",
  },
  callback: async (context, limit, args) => {
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

    return fetchContentForKeyword(context, keyword, startDate, endDate, limit);
  },
});

export const keywordAlertsQueryHandlers = Query;

export const keywordAlertsTypeDefs = gql`
  ${keywordAlertTypeDef}
  ${typeDefs}
`;
