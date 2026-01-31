import "@/components/momentjs";

import React, { Suspense } from "react";
import ClientAppGenerator, { EnvironmentOverrideContextProvider } from "@/components/layout/ClientAppGenerator";
import { cookies } from "next/headers";
import { DEFAULT_TIMEZONE, SSRMetadata } from "@/lib/utils/timeUtil";
import ClientIDAssigner from "@/components/analytics/ClientIDAssigner";
import { CLIENT_ID_COOKIE, CLIENT_ID_NEW_COOKIE, TIMEZONE_COOKIE } from "@/lib/cookies/cookies";
import { SharedScripts } from "@/components/next/SharedScripts";
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import { BodyWithBackgroundColor } from "@/components/layout/PageBackgroundWrapper";
import PageBackgroundColorSwitcher from "@/components/layout/PageBackgroundColorSwitcher";

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
        <SharedScripts/>
      </head>
      <BodyWithBackgroundColor>
        <Suspense>
          <ClientIDAssignerServer/>
          <PageBackgroundColorSwitcher/>
        </Suspense>
        <Suspense>
          <EnvironmentOverrideContextProviderServer>
            <ClientAppGenerator abTestGroupsUsed={{}}>
              {children}
            </ClientAppGenerator>
          </EnvironmentOverrideContextProviderServer>
        </Suspense>
      </BodyWithBackgroundColor>
    </html>
  );
}

const ClientIDAssignerServer = async () => {
  const ClientIdsRepo = (await import("@/server/repos/ClientIdsRepo")).default;
  const cookieStore = await cookies();
  const clientId = cookieStore.get(CLIENT_ID_COOKIE)?.value ?? null;
  const clientIdNewCookieExists = !!cookieStore.get(CLIENT_ID_NEW_COOKIE)?.value;
  const clientIdInvalidated = clientId && await new ClientIdsRepo().isClientIdInvalidated(clientId); // TODO Move off the critical path
  return <ClientIDAssigner clientIdNewCookieExists={clientIdNewCookieExists} clientIdInvalidated={!!clientIdInvalidated}/>
}

const EnvironmentOverrideContextProviderServer = async ({children}: {
  children: React.ReactNode
}) => {
  const cookieStore = await cookies();
  const timezoneCookie = cookieStore.get(TIMEZONE_COOKIE);
  const timezone = timezoneCookie?.value ?? DEFAULT_TIMEZONE;

  const ssrMetadata: SSRMetadata = {
    renderedAt: new Date().toISOString(),
    // TODO: figure out how to port the exising cache-control response header logic here
    cacheFriendly: false,
    timezone,
  };
  return <EnvironmentOverrideContextProvider ssrMetadata={ssrMetadata}>
    {children}
  </EnvironmentOverrideContextProvider>
}
