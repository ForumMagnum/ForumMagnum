import { forumTitleSetting, siteUrlSetting } from '../../lib/instanceSettings';
import { defineGqlQuery } from '../utils/serverGraphqlUtil';
import { getLogoUrl } from '../../lib/vulcan-lib/utils';

defineGqlQuery({
  name: "SiteData",
  resultType: "Site",
  schema: `type Site {
    title: String!
    url: String!
    logoUrl: String
  }`,
  fn: function SiteData(root: void, args: void, context: ResolverContext): Site {
    return {
      title: forumTitleSetting.get(),
      url: siteUrlSetting.get(),
      logoUrl: getLogoUrl()||null,
    };
  },
});
