import { getForumTypeForPage } from "@/server/utils/requestUtil";
import React from "react";
import PostsSingleRoute from '@/components/posts/PostsSingleRoute';
import RouteRoot from "@/components/layout/RouteRoot";
import { aboutPostIdSetting } from "@/lib/instanceSettings";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

assertRouteAttributes("/about", {
  whiteBackground: true,
  hasLinkPreview: false,
  hasPingbacks: true,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: true,
});

export default async function Page() {
  const forumType = await getForumTypeForPage();
  return <RouteRoot delayedStatusCode>
    <PostsSingleRoute _id={aboutPostIdSetting.get(forumType)} />
  </RouteRoot>;
}
