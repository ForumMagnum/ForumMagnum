import "@/components/momentjs";

import React, { Suspense } from "react";
import ClientAppGenerator from "@/components/layout/ClientAppGenerator";
import { cookies } from "next/headers";
import ClientIDAssigner from "@/components/analytics/ClientIDAssigner";
import { TIMEZONE_COOKIE } from "@/lib/cookies/cookies";
import { SharedScripts } from "@/components/next/SharedScripts";
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import { BodyWithBackgroundColor } from "@/components/layout/PageBackgroundWrapper";
import PageBackgroundColorSwitcher from "@/components/layout/PageBackgroundColorSwitcher";
import { getForumTypeForPage } from "@/server/utils/pageUtil";
import { faviconUrlSetting } from "@/lib/instanceSettings";

export async function generateMetadata(): Promise<Metadata> {
  return getDefaultMetadata();
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <head>
        {/* Keep the JSS markers outside Suspense so streamed styles inserted
            between them are preserved during hydration. */}
        <SharedScripts/>
        <Suspense>
          <ForumFavicon/>
        </Suspense>
      </head>
      <BodyWithBackgroundColor>
        <ClientIDAssigner/>
        <Suspense>
          <PageBackgroundColorSwitcher/>
        </Suspense>
        <ClientAppGeneratorWithRequestId>
          {children}
        </ClientAppGeneratorWithRequestId>
      </BodyWithBackgroundColor>
    </html>
  );
}

async function ForumFavicon() {
  const forumType = await getForumTypeForPage();
  return <link rel="icon" href={faviconUrlSetting.get(forumType)}/>;
}

const ClientAppGeneratorWithRequestId = async ({ children }: {
  children: React.ReactNode,
}) => {
  const { getRequestIdForServerComponentOrGenerateMetadata } = await import("@/server/rendering/requestId");
  const requestId = await getRequestIdForServerComponentOrGenerateMetadata();
  const [forumType, cookieStore] = await Promise.all([getForumTypeForPage(), cookies()]);
  // Passed down explicitly so that the client hydrates with the timezone this
  // render used, even if the browser's own cookie differs from what the server
  // received (as it does for pages served from the CDN cache).
  const ssrTimezone = cookieStore.get(TIMEZONE_COOKIE)?.value ?? null;

  return <ClientAppGenerator abTestGroupsUsed={{}} requestId={requestId} forumType={forumType} ssrTimezone={ssrTimezone}>
    {children}
  </ClientAppGenerator>
}
