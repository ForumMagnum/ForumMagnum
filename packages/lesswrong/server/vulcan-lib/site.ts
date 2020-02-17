import { addGraphQLSchema, addGraphQLResolvers, addGraphQLQuery } from '../../lib/vulcan-lib/graphql';
import { Utils } from '../../lib/vulcan-lib/utils';
import { getSetting } from '../../lib/vulcan-lib/settings';
import { Meteor } from 'meteor/meteor'

const siteSchema = `type Site {
  title: String
  url: String
  logoUrl: String
}`;
addGraphQLSchema(siteSchema);

const siteResolvers = {
  Query: {
    SiteData(root, args, context) {
      return {
        title: getSetting('title'),
        url: getSetting('siteUrl', Meteor.absoluteUrl()),
        logoUrl: Utils.getLogoUrl(),
      };
    },
  },
};

addGraphQLResolvers(siteResolvers);

addGraphQLQuery('SiteData: Site');
