import "@/components/momentjs";

import React from "react";
import ClientAppGenerator from "@/components/next/ClientAppGenerator";
import { getInstanceSettings } from "@/lib/getInstanceSettings";
import { cookies } from "next/headers";
import { ClientRouteMetadataProvider } from "@/components/ClientRouteMetadataContext";
import { DEFAULT_TIMEZONE } from "@/lib/utils/timeUtil";
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
  const cookieStore = await cookies();

  const publicInstanceSettings = getInstanceSettings().public;

  const timezoneCookie = cookieStore.get(TIMEZONE_COOKIE);

  const timezone = timezoneCookie?.value ?? DEFAULT_TIMEZONE;
  const clientId = cookieStore.get(CLIENT_ID_COOKIE)?.value ?? null;
  const clientIdNewCookieExists = !!cookieStore.get(CLIENT_ID_NEW_COOKIE)?.value;

  const clientIdInvalidated = clientId && await new ClientIdsRepo().isClientIdInvalidated(clientId); // TODO Move off the critical path

  const routeMetadata = getRouteMetadata().get();

  return (
    <html>
      <head>
        <SharedScripts />
      </head>
      <body>
        <ClientRouteMetadataProvider initialMetadata={routeMetadata}>
        <ClientIDAssigner clientIdNewCookieExists={clientIdNewCookieExists} clientIdInvalidated={!!clientIdInvalidated}/>
        <ClientAppGenerator
          abTestGroupsUsed={{}}
          ssrMetadata={{
            renderedAt: new Date().toISOString(),
            // TODO: figure out how to port the exising cache-control response header logic here
            cacheFriendly: false,
            timezone,
          }}
        >
          {children}
        </ClientAppGenerator>
        </ClientRouteMetadataProvider>
      </body>
    </html>
  );
}

