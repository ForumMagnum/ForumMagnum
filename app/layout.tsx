import React from "react";
import AppGenerator from "@/components/next/ClientAppGenerator";
import { getInstanceSettings } from "@/lib/getInstanceSettings";
import Script from "next/script";
import { toEmbeddableJson } from "@/lib/utils/jsonUtils";
import { cookies, headers } from "next/headers";
import { ClientRouteMetadataProvider } from "@/components/ClientRouteMetadataContext";
import { DEFAULT_TIMEZONE } from "@/lib/utils/timeUtil";
import { getCachedUser } from "@/server/vulcan-lib/apollo-server/context";
import { abstractThemeToConcrete, getThemeOptions } from "@/themes/themeNames";
import StyleRegistry from "app/StyleRegistry";
import { getRouteMetadata } from "@/components/ServerRouteMetadataContext";

export default async function RootLayout({
  children,
  searchParams,
}: {
  children: React.ReactNode;
  searchParams: Promise<URLSearchParams>;
}) {
  const [cookieStore, headerValues, searchParamValues] = await Promise.all([
    cookies(),
    headers(),
    searchParams,
  ]);

  const publicInstanceSettings = getInstanceSettings().public;

  const cookieStoreArray = cookieStore.getAll();

  const timezoneCookie = cookieStore.get("timezone");
  const themeCookie = cookieStore.get("theme")?.value ?? null;

  const timezone = timezoneCookie?.value ?? DEFAULT_TIMEZONE;

  const user = await getCachedUser(cookieStore.get("loginToken")?.value ?? null);
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
        <meta httpEquiv='delegate-ch' content='sec-ch-dpr https://res.cloudinary.com;' />
      </head>
      <body>
        <style id="jss-insertion-start" />
        <style id="jss-insertion-end" />
        <StyleRegistry themeOptions={themeOptions}>
        <ClientRouteMetadataProvider initialMetadata={routeMetadata}>
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
          searchParams={Object.fromEntries(searchParamValues?.entries() ?? [])}
        >
          {children}
        </AppGenerator>
        </ClientRouteMetadataProvider>
        </StyleRegistry>
      </body>
    </html>
  );
}

