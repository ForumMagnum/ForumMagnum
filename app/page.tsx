import React from "react";
import HomePageWithDesignChat from "@/components/common/HomePageWithDesignChat";
import LWHome from "@/components/common/LWHome";
import RouteRoot from "@/components/layout/RouteRoot";
import AlignmentForumHome from "@/components/alignment-forum/AlignmentForumHome";
import { forumSelect } from "@/lib/forumTypeUtils";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

assertRouteAttributes("/", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: true,
  hasMarkdownVersion: true,
});

export default async function Home({ searchParams }: {
  searchParams?: Promise<{
    classicHome?: string | string[] | undefined;
    theme?: string | string[] | undefined;
    openCustomize?: string | string[] | undefined;
  }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const openCustomizeParam = Array.isArray(params?.openCustomize) ? params?.openCustomize[0] : params?.openCustomize;

  return <RouteRoot>
    {forumSelect({
      AlignmentForum: <AlignmentForumHome/>,
      LessWrong: <HomePageWithDesignChat initialIsOpen={Boolean(openCustomizeParam)} />,
      default: <LWHome/>,
    })}
  </RouteRoot>;
}
