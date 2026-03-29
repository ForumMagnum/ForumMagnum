import React from "react";
import LWHome from "@/components/common/LWHome";
import RouteRoot from "@/components/layout/RouteRoot";
import AlignmentForumHome from "@/components/alignment-forum/AlignmentForumHome";
import NewspaperFrontpage from "@/components/newspaper/NewspaperFrontpage";
import { forumSelect } from "@/lib/forumTypeUtils";
import { isLW } from "@/lib/instanceSettings";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

assertRouteAttributes("/", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: true,
  hasMarkdownVersion: true,
});

function isNewspaperDay(searchParams: Record<string, string | string[] | undefined>): boolean {
  if (searchParams.newspaper === 'true') return true;
  if (searchParams.newspaper === 'false') return false;

  const now = new Date();
  return now.getMonth() === 3 && now.getDate() === 1; // April 1st (0-indexed months)
}

export default async function Home({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  if (isLW() && isNewspaperDay(params)) {
    return <RouteRoot>
      <NewspaperFrontpage />
    </RouteRoot>;
  }

  return <RouteRoot>
    {forumSelect({
      AlignmentForum: <AlignmentForumHome/>,
      LessWrong: <LWHome/>,
      default: <LWHome/>,
    })}
  </RouteRoot>;
}
