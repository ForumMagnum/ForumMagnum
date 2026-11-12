import { getForumTypeForPage } from "@/server/utils/pageUtil";
import React from "react";
import PostsSingleRoute from '@/components/posts/PostsSingleRoute';
import RouteRoot from "@/components/layout/RouteRoot";
import { faqPostIdSetting } from "@/lib/instanceSettings";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

assertRouteAttributes("/faq", {
  whiteBackground: true,
  hasLinkPreview: false,
  hasPingbacks: true,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: true,
});

export default async function Page() {
  const forumType = await getForumTypeForPage();
  return <RouteRoot delayedStatusCode>
    <PostsSingleRoute _id={faqPostIdSetting.get(forumType)} />
  </RouteRoot>;
}
