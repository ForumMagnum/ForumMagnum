import gql from 'graphql-tag';
import { forumTitleSetting, siteUrlSetting } from '../../lib/instanceSettings';
import { getLogoUrl } from '../../lib/vulcan-lib/utils';

export const siteGraphQLTypeDefs = gql`
  type Site {
    title: String
    url: String
    logoUrl: String
  }
  extend type Query {
    SiteData: Site
  }
`

export const siteGraphQLQueries = {
  SiteData: async (root: void, args: void, context: ResolverContext) => {
    return {
      title: forumTitleSetting.get(),
      url: siteUrlSetting.get(),
      logoUrl: getLogoUrl(),
    };
  },
};