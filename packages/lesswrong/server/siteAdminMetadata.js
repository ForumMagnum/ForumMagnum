import { addGraphQLResolvers, addGraphQLSchema, addGraphQLQuery } from 'meteor/vulcan:core';
import { getUnrecognizedIndexes, getMissingIndexes } from './indexUtil';

const siteAdminMetadataSchema = `type SiteAdminMetadata {
  missingIndexes: JSON,
  extraIndexes: JSON,
}`;
addGraphQLSchema(siteAdminMetadataSchema );

const siteAdminMetadataResolvers = {
  Query: {
    AdminMetadata(root, args, context) {
      if (!context.currentUser || !context.currentUser.isAdmin)
        throw new Error("AdminMetadata graphQL API requires being logged in as an admin");
      
      return {
        missingIndexes: getMissingIndexes(),
        extraIndexes: getUnrecognizedIndexes(),
      };
    }
  }
};
addGraphQLResolvers(siteAdminMetadataResolvers);
addGraphQLQuery("AdminMetadata: SiteAdminMetadata");
