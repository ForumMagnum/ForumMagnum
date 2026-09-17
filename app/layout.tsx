import "@/components/momentjs";

import React, { Suspense } from "react";
import ClientAppGenerator from "@/components/layout/ClientAppGenerator";
import { cookies } from "next/headers";
import ClientIDAssigner from "@/components/analytics/ClientIDAssigner";
import { CLIENT_ID_COOKIE, CLIENT_ID_NEW_COOKIE } from "@/lib/cookies/cookies";
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
        <Suspense>
          <ClientIDAssignerServer/>
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
  const forumType = await getForumTypeForPage();

  return <ClientAppGenerator abTestGroupsUsed={{}} requestId={requestId} forumType={forumType}>
    {children}
  </ClientAppGenerator>
}

const ClientIDAssignerServer = async () => {
  const ClientIdsRepo = (await import("@/server/repos/ClientIdsRepo")).default;
  const cookieStore = await cookies();
  const clientId = cookieStore.get(CLIENT_ID_COOKIE)?.value ?? null;
  const clientIdNewCookieExists = !!cookieStore.get(CLIENT_ID_NEW_COOKIE)?.value;
  const clientIdInvalidated = clientId && await new ClientIdsRepo().isClientIdInvalidated(clientId); // TODO Move off the critical path
  return <ClientIDAssigner clientIdNewCookieExists={clientIdNewCookieExists} clientIdInvalidated={!!clientIdInvalidated}/>
}
