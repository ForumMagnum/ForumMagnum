import React from "react";
import AppGenerator from "@/components/next/ClientAppGenerator";
import type { SearchParams } from "next/dist/server/request/search-params";
import { getInstanceSettings } from "@/lib/getInstanceSettings";
import Script from "next/script";
import { toEmbeddableJson } from "@/lib/utils/jsonUtils";
import { cookies } from "next/headers";
import { RouteMetadataProvider } from "@/components/RouteMetadataContext";
import { initDatabases, initSettings } from "@/server/serverStartup";
import { getPublicSettings } from "@/lib/settingsCache";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cookieStore] = await Promise.all([
    cookies(),
    initDatabases({ postgresUrl: process.env.PG_URL ?? '', postgresReadUrl: process.env.PG_URL ?? '' }).then(() => initSettings()),
  ]);

  const publicInstanceSettings = getInstanceSettings().public;
  const publicDatabaseSettings = getPublicSettings();

  const cookieStoreArray = cookieStore.getAll();

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
        >
          {children}
        </AppGenerator>
        </RouteMetadataProvider>
      </body>
    </html>
  );
}

