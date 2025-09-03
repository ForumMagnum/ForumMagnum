import React from "react";
import AppGenerator from "@/components/next/ClientAppGenerator";
import { getInstanceSettings } from "@/lib/getInstanceSettings";
import Script from "next/script";
import { toEmbeddableJson } from "@/lib/utils/jsonUtils";
import { cookies, headers } from "next/headers";
import { ClientRouteMetadataProvider } from "@/components/ClientRouteMetadataContext";
import { DEFAULT_TIMEZONE } from "@/lib/utils/timeUtil";
import { getUser } from "@/server/vulcan-lib/apollo-server/getUserFromReq";
import { abstractThemeToConcrete, getThemeOptions } from "@/themes/themeNames";
import { getRouteMetadata } from "@/components/ServerRouteMetadataContext";
import { getEmbeddedStyleLoaderScript } from "@/components/hooks/embedStyles";
import { globalExternalStylesheets } from "@/themes/globalStyles/externalStyles";

import "@/components/momentjs";
import ClientIDAssigner from "@/components/analytics/ClientIDAssigner";
import ClientIdsRepo from "@/server/repos/ClientIdsRepo";
import { CLIENT_ID_COOKIE, THEME_COOKIE, TIMEZONE_COOKIE } from "@/lib/cookies/cookies";
import { getDefaultAbsoluteUrl } from "@/lib/instanceSettings";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cookieStore, headerValues] = await Promise.all([
    cookies(),
    headers(),
  ]);

  const publicInstanceSettings = getInstanceSettings().public;
  // Since we can't statically define the site url in one of the settings files,
  // (because for e.g. preview branches it depends on a value only known to Vercel
  // at build time & runtime), explicitly embed it at runtime.
  publicInstanceSettings.siteUrl = getDefaultAbsoluteUrl();

  const cookieStoreArray = cookieStore.getAll();

  const timezoneCookie = cookieStore.get(TIMEZONE_COOKIE);
  const themeCookie = cookieStore.get(THEME_COOKIE)?.value ?? null;

  const timezone = timezoneCookie?.value ?? DEFAULT_TIMEZONE;
  const clientId = cookieStore.get(CLIENT_ID_COOKIE)?.value ?? null;

  const [user, clientIdInvalidated] = await Promise.all([
    getUser(cookieStore.get("loginToken")?.value ?? null),
    clientId && new ClientIdsRepo().isClientIdInvalidated(clientId)
  ]);
  const abstractThemeOptions = getThemeOptions(themeCookie, user);
  const themeOptions = abstractThemeToConcrete(abstractThemeOptions, false);

  const headerEntries = Object.fromEntries(Array.from((headerValues as AnyBecauseHard).entries() as [string, string][]));

  const routeMetadata = getRouteMetadata().get();

  return (
    <html>
      <head>
        <Script strategy="beforeInteractive" id="public-instance-settings">
          {`window.publicInstanceSettings = ${toEmbeddableJson(publicInstanceSettings)}`}
        </Script>
        {globalExternalStylesheets.map(stylesheet => <link key={stylesheet} rel="stylesheet" type="text/css" href={stylesheet}/>)}
        <script dangerouslySetInnerHTML={{__html: getEmbeddedStyleLoaderScript()}}/>
        <meta httpEquiv='delegate-ch' content='sec-ch-dpr https://res.cloudinary.com;' />
        {
          // HACK: These insertion-point markers are <script> tags (rather than
          // <style> tags) because <style> is special-cased in a way that
          // interacts badly with our dynamic insertion leading to a hydration
          // mismatch
          //
        }
        <script id="jss-insertion-start"/>
        {
          //Style tags are dynamically inserted here
        }
        <script id="jss-insertion-end"/>
      </head>
      <body>
        <ClientRouteMetadataProvider initialMetadata={routeMetadata}>
        <ClientIDAssigner cookieArray={cookieStoreArray} clientIdInvalidated={!!clientIdInvalidated}/>
        <AppGenerator
          abTestGroupsUsed={{}}
          themeOptions={abstractThemeOptions}
          cookies={cookieStoreArray}
          ssrMetadata={{
            renderedAt: new Date().toISOString(),
            // TODO: figure out how to port the exising cache-control response header logic here
            cacheFriendly: false,
            timezone,
          }}
          user={user}
          headers={headerEntries}
        >
          {children}
        </AppGenerator>
        </ClientRouteMetadataProvider>
      </body>
    </html>
  );
}

