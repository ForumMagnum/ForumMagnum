import React from "react";
import LWHome from "@/components/common/LWHome";
import RouteRoot from "@/components/layout/RouteRoot";
import AlignmentForumHome from "@/components/alignment-forum/AlignmentForumHome";
import { forumSelect } from "@/lib/forumTypeUtils";
import EAHome from "@/components/ea-forum/EAHome";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

assertRouteAttributes("/", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: true,
  hasMarkdownVersion: true,
});

export default async function Home() {
  return <RouteRoot>
    {forumSelect({
      AlignmentForum: <AlignmentForumHome/>,
      LessWrong: <LWHome/>,
      EAForum: <EAHome/>,
      default: <LWHome/>,
    })}
  </RouteRoot>;
}
