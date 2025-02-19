import { forumTitleSetting, siteUrlSetting } from '../../lib/instanceSettings';
import { addGraphQLQuery, addGraphQLResolvers, addGraphQLSchema } from '../../lib/vulcan-lib/graphql';
import { getLogoUrl } from '../../lib/vulcan-lib/utils';

const siteSchema = `type Site {
  title: String
  url: String
  logoUrl: String
}`;
addGraphQLSchema(siteSchema);

const siteResolvers = {
  Query: {
    SiteData(root: void, args: void, context: ResolverContext) {
      return {
        title: forumTitleSetting.get(),
        url: siteUrlSetting.get(),
        logoUrl: getLogoUrl(),
      };
    },
  },
};

addGraphQLResolvers(siteResolvers);

addGraphQLQuery('SiteData: Site');
