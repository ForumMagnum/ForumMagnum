import "@/components/momentjs";

import React, { Suspense } from "react";
import ClientAppGenerator, { EnvironmentOverrideContextProvider } from "@/components/next/ClientAppGenerator";
import { cookies } from "next/headers";
import { ClientRouteMetadataProvider } from "@/components/ClientRouteMetadataContext";
import { DEFAULT_TIMEZONE, SSRMetadata } from "@/lib/utils/timeUtil";
import { getRouteMetadata } from "@/components/ServerRouteMetadataContext";
import ClientIDAssigner from "@/components/analytics/ClientIDAssigner";
import ClientIdsRepo from "@/server/repos/ClientIdsRepo";
import { CLIENT_ID_COOKIE, CLIENT_ID_NEW_COOKIE, TIMEZONE_COOKIE } from "@/lib/cookies/cookies";
import { SharedScripts } from "@/components/next/SharedScripts";
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return getDefaultMetadata();
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const routeMetadata = getRouteMetadata().get();

  return (
    <html>
      <head>
        <SharedScripts/>
      </head>
      <body>
        <Suspense>
          <ClientIDAssignerServer/>
        </Suspense>
        <Suspense>
          <EnvironmentOverrideContextProviderServer>
            <ClientRouteMetadataProvider initialMetadata={routeMetadata}>
              <ClientAppGenerator abTestGroupsUsed={{}}>
                {children}
              </ClientAppGenerator>
            </ClientRouteMetadataProvider>
          </EnvironmentOverrideContextProviderServer>
        </Suspense>
      </body>
    </html>
  );
}

const ClientIDAssignerServer = async () => {
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