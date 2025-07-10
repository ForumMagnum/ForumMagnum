import React from "react";
import AppGenerator from "@/components/next/ClientAppGenerator";
import { getInstanceSettings } from "@/lib/getInstanceSettings";
import Script from "next/script";
import { toEmbeddableJson } from "@/lib/utils/jsonUtils";
import { cookies, headers } from "next/headers";
import { RouteMetadataProvider } from "@/components/RouteMetadataContext";
import { initDatabases, initSettings } from "@/server/serverStartup";
import { getPublicSettings } from "@/lib/settingsCache";
import { DEFAULT_TIMEZONE } from "@/lib/utils/timeUtil";
import { getCachedUser } from "@/server/vulcan-lib/apollo-server/context";

export default async function RootLayout({
  children,
  searchParams,
}: {
  children: React.ReactNode;
  searchParams: Promise<URLSearchParams>;
}) {
  initDatabases({ postgresUrl: process.env.PG_URL ?? '', postgresReadUrl: process.env.PG_READ_URL ?? '' });
  const [cookieStore, headerValues, searchParamValues] = await Promise.all([
    cookies(),
    headers(),
    searchParams,
    initSettings(),
  ]);

  const publicInstanceSettings = getInstanceSettings().public;
  const publicDatabaseSettings = getPublicSettings();

  const cookieStoreArray = cookieStore.getAll();

  const timezoneCookie = cookieStore.get("timezone");

  const timezone = timezoneCookie?.value ?? DEFAULT_TIMEZONE;

  const user = await getCachedUser(cookieStore.get("loginToken")?.value ?? null);

  const headerEntries = Object.fromEntries(Array.from((headerValues as AnyBecauseHard).entries() as [string, string][]));

  return (
    <html>
      <head>
        <Script strategy="beforeInteractive" id="public-instance-settings">
          {`window.publicInstanceSettings = ${toEmbeddableJson(publicInstanceSettings)}`}
          {`window.publicSettings = ${toEmbeddableJson(publicDatabaseSettings)}`}
        </Script>
        <meta httpEquiv='delegate-ch' content='sec-ch-dpr https://res.cloudinary.com;' />
      </head>
      <body>
        <span id="jss-insertion-start"></span>
        <span id="jss-insertion-end"></span>
        <RouteMetadataProvider>
        <AppGenerator
          abTestGroupsUsed={{}}
          themeOptions={{ name: "auto" }}
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
        </RouteMetadataProvider>
      </body>
    </html>
  );
}

