import { addGraphQLResolvers, addGraphQLSchema, addGraphQLQuery } from './vulcan-lib';
import { getUnrecognizedIndexes, getMissingIndexes } from './indexUtil';

// missingIndexes and extraIndexes are sent as stringified JSON rather than as
// real JSON, because for Mongo indexes the order of keys matters, and that
// ordering doesn't survive traversal through GraphQL.
const siteAdminMetadataSchema = `type SiteAdminMetadata {
  missingIndexes: String,
  extraIndexes: String,
}`;
addGraphQLSchema(siteAdminMetadataSchema );

const siteAdminMetadataResolvers = {
  Query: {
    async AdminMetadata(root, args, context: ResolverContext) {
      if (!context.currentUser || !context.currentUser.isAdmin)
        throw new Error("AdminMetadata graphQL API requires being logged in as an admin");
      
      let missingIndexes = await getMissingIndexes();
      let extraIndexes = await getUnrecognizedIndexes();
      return {
        missingIndexes: JSON.stringify(missingIndexes),
        extraIndexes: JSON.stringify(extraIndexes),
      };
    }
  }
};
addGraphQLResolvers(siteAdminMetadataResolvers);
addGraphQLQuery("AdminMetadata: SiteAdminMetadata");
