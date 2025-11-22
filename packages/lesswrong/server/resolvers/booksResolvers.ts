import gql from "graphql-tag";

export const booksResolversTypeDefs = gql`
  extend type Query {
    getBookWordCount(bookId: String!): Float
  }
`;

export const booksResolversQueries = {
  getBookWordCount: async (root: void, { bookId }: { bookId: string }, context: ResolverContext) => {
    return await context.repos.books.getBookWordCount(bookId);
  },
};

