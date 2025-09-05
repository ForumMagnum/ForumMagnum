import React from "react";
import ClientAppGenerator from "@/components/next/ClientAppGenerator";
import { getInstanceSettings } from "@/lib/getInstanceSettings";
import { cookies } from "next/headers";
import { ClientRouteMetadataProvider } from "@/components/ClientRouteMetadataContext";
import { DEFAULT_TIMEZONE } from "@/lib/utils/timeUtil";
import { getUser } from "@/server/vulcan-lib/apollo-server/getUserFromReq";
import { abstractThemeToConcrete, getThemeOptions } from "@/themes/themeNames";
import { getRouteMetadata } from "@/components/ServerRouteMetadataContext";

import "@/components/momentjs";
import ClientIDAssigner from "@/components/analytics/ClientIDAssigner";
import ClientIdsRepo from "@/server/repos/ClientIdsRepo";
import { CLIENT_ID_COOKIE, CLIENT_ID_NEW_COOKIE, THEME_COOKIE, TIMEZONE_COOKIE } from "@/lib/cookies/cookies";
import { getDefaultAbsoluteUrl } from "@/lib/instanceSettings";
import { SharedScripts } from "@/components/next/SharedScripts";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  const publicInstanceSettings = getInstanceSettings().public;
  // Since we can't statically define the site url in one of the settings files,
  // (because for e.g. preview branches it depends on a value only known to Vercel
  // at build time & runtime), explicitly embed it at runtime.
  publicInstanceSettings.siteUrl = getDefaultAbsoluteUrl();

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

