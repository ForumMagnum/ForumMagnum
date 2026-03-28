import React from "react";
import LWHome from "@/components/common/LWHome";
import RouteRoot from "@/components/layout/RouteRoot";
import AlignmentForumHome from "@/components/alignment-forum/AlignmentForumHome";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";
import { getResolverContextForServerComponent } from "@/server/pageMetadata/sharedMetadata";

assertRouteAttributes("/", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: true,
  hasMarkdownVersion: true,
});

export default async function Home({ searchParams }: { searchParams: Promise<{}> }) {
  const resolverContext = await getResolverContextForServerComponent(await searchParams);
  if (resolverContext.isAF) {
    return <RouteRoot>
      <AlignmentForumHome/>
    </RouteRoot>;
  } else {
    return <RouteRoot>
      <LWHome/>
    </RouteRoot>;
  }
}
