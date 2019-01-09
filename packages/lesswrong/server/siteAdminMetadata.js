import { addGraphQLResolvers, addGraphQLSchema, addGraphQLQuery } from 'meteor/vulcan:core';

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
        missingIndexes: {}, //TODO
        extraIndexes: {}, //TODO
      };
    }
  }
};
addGraphQLResolvers(siteAdminMetadataResolvers);
addGraphQLQuery("AdminMetadata: SiteAdminMetadata");
