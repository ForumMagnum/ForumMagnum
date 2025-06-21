import React from "react";
import AppGenerator from "@/components/next/ClientAppGenerator";
import type { SearchParams } from "next/dist/server/request/search-params";

export default async function RootLayout({
  children,
  searchParams,
}: {
  children: React.ReactNode;
  searchParams: Promise<SearchParams>;
}) {
  const searchParamValues = await searchParams;
  console.log(searchParamValues, searchParams);
  return (
    <html>
      <body>
        <span id="jss-insertion-start"></span>
        <span id="jss-insertion-end"></span>
        <AppGenerator
          abTestGroupsUsed={{}}
          themeOptions={{ name: "auto" }}
          searchParams={searchParamValues}
        >
          {children}
        </AppGenerator>
      </body>
    </html>
  );
}

