import React from "react";
import LWHome from "@/components/common/LWHome";
import SandboxedHomePage from "@/components/common/SandboxedHomePage";
import HomeDesignChatProvider from "@/components/common/HomeDesignChatProvider";
import RouteRoot from "@/components/layout/RouteRoot";
import AlignmentForumHome from "@/components/alignment-forum/AlignmentForumHome";
import { forumSelect } from "@/lib/forumTypeUtils";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

assertRouteAttributes("/", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: true,
});

export default async function Home() {
  return <HomeDesignChatProvider>
    <RouteRoot>
      {forumSelect({
        AlignmentForum: <AlignmentForumHome/>,
        LessWrong: <SandboxedHomePage/>,
        default: <LWHome/>,
      })}
    </RouteRoot>
  </HomeDesignChatProvider>;
}
