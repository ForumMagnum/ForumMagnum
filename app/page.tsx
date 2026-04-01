import React from "react";
import { cookies } from "next/headers";
import LWHome from "@/components/common/LWHome";
import SandboxedHomePage from "@/components/common/SandboxedHomePage";
import HomeDesignChatProvider from "@/components/common/HomeDesignChatProvider";
import RouteRoot from "@/components/layout/RouteRoot";
import AlignmentForumHome from "@/components/alignment-forum/AlignmentForumHome";
import { forumSelect } from "@/lib/forumTypeUtils";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";
import { HOME_DESIGN_DEFAULT_CLASSIC_VALUE, HOME_DESIGN_DEFAULT_PUBLIC_ID_COOKIE } from "@/lib/cookies/cookies";

assertRouteAttributes("/", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: true,
  hasMarkdownVersion: true,
});

export default async function Home({ searchParams }: {
  searchParams?: Promise<{ classicHome?: string | string[] | undefined; theme?: string | string[] | undefined }>;
}) {
  const cookieStore = await cookies();
  const params = searchParams ? await searchParams : undefined;
  const classicHomeParam = Array.isArray(params?.classicHome) ? params?.classicHome[0] : params?.classicHome;
  const themeParam = Array.isArray(params?.theme) ? params?.theme[0] : params?.theme;
  const preferredHomeDesignCookie = cookieStore.get(HOME_DESIGN_DEFAULT_PUBLIC_ID_COOKIE)?.value;
  const classicHomeFromCookie = preferredHomeDesignCookie === HOME_DESIGN_DEFAULT_CLASSIC_VALUE;
  const useClassicHome = classicHomeParam === '1' || classicHomeParam === 'true' || (!themeParam && classicHomeFromCookie);

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
