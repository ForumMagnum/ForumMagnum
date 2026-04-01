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
  hasLeftNavigationColumn: true,
  hasMarkdownVersion: true,
});

export default async function Home({ searchParams }: {
  searchParams?: Promise<{ classicHome?: string | string[] | undefined }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const classicHomeParam = Array.isArray(params?.classicHome) ? params?.classicHome[0] : params?.classicHome;
  const useClassicHome = classicHomeParam === '1' || classicHomeParam === 'true';

  return <RouteRoot>
    {forumSelect({
      AlignmentForum: <AlignmentForumHome/>,
      LessWrong: useClassicHome ? <LWHome/> : (
        <HomeDesignChatProvider>
          <SandboxedHomePage/>
        </HomeDesignChatProvider>
      ),
      default: <LWHome/>,
    })}
  </RouteRoot>;
}
