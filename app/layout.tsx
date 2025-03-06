import React, { Suspense } from 'react';
// eslint-disable-next-line no-restricted-imports
import "./globals.css";
import Providers from "./Providers";

import { loadDatabaseSettings } from '@/server/loadDatabaseSettings';
import { initDatabases } from '@/server/serverStartup';
import Script from 'next/script';
import { getPublicSettings, setPublicSettings } from '@/lib/settingsCache';
import Loading from './loadingA';
import { getSqlClient } from '@/server/sql/sqlClient';


const sqlClient = getSqlClient()
if (!sqlClient) {
  await initDatabases({
    postgresUrl: process.env.PG_URL || '',
    postgresReadUrl: process.env.PG_URL || '',
  })
}

const { serverSettingsObject, publicSettingsObject, loadedDatabaseId } = await loadDatabaseSettings()
console.log("publicSettingsObject", publicSettingsObject)
setPublicSettings(publicSettingsObject?.value)

console.log("Running layout")

export default function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { id: string };
}>) {
  console.log("Rerendering layout")
  return (
    <html>
      <body>
        <div id="jss-insertion-start" />
        <div id="jss-insertion-end" />
        <Script strategy="beforeInteractive" id="public-settings">
          {`console.log("WOOP")`}
          {`window.publicSettings = ${JSON.stringify(publicSettingsObject?.value)}`}
        </Script>
        <Providers publicSettings={publicSettingsObject?.value}>
          <Suspense fallback={<Loading />}>
            {children}
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}