import React from "react";
import AppGenerator from "@/components/next/ClientAppGenerator";
import type { SearchParams } from "next/dist/server/request/search-params";
import { getInstanceSettings } from "@/lib/getInstanceSettings";
import Script from "next/script";
import { toEmbeddableJson } from "@/lib/utils/jsonUtils";
import { cookies } from "next/headers";

export default async function RootLayout({
  children,
  searchParams,
}: {
  children: React.ReactNode;
  searchParams: Promise<SearchParams>;
}) {
  const searchParamValues = await searchParams;
  const publicInstanceSettings = getInstanceSettings().public;
  const cookieStore = await cookies();
  const cookieStoreArray = cookieStore.getAll();

  return (
    <html>
      <head>
        <Script strategy="beforeInteractive" id="public-instance-settings">
          {`window.publicInstanceSettings = ${toEmbeddableJson(publicInstanceSettings)}`}
        </Script>
      </head>
      <body>
        <span id="jss-insertion-start"></span>
        <span id="jss-insertion-end"></span>
        <AppGenerator
          abTestGroupsUsed={{}}
          themeOptions={{ name: "auto" }}
          searchParams={searchParamValues}
          cookies={cookieStoreArray}
        >
          {children}
        </AppGenerator>
      </body>
    </html>
  );
}

