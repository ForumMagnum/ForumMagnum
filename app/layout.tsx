import React from 'react';
// eslint-disable-next-line no-restricted-imports
import "./globals.css";
import Providers from "./Providers";

import { loadDatabaseSettings } from '@/server/loadDatabaseSettings';
import { initDatabases } from '@/server/serverStartup';
import Script from 'next/script';
import { getPublicSettings, setPublicSettings } from '@/lib/settingsCache';

await initDatabases({
  postgresUrl: process.env.PG_URL || '',
  postgresReadUrl: process.env.PG_URL || '',
})

const { serverSettingsObject, publicSettingsObject, loadedDatabaseId } = await loadDatabaseSettings()
setPublicSettings(publicSettingsObject?.value)

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // console.log({serverSettingsObject, publicSettingsObject, loadedDatabaseId})
  return (
    <html>
      <body>
        <div id="jss-insertion-start" />
        <div id="jss-insertion-end" />
        <Script strategy="beforeInteractive">
          {`console.log("WOOP")`}
          {`window.publicSettings = ${JSON.stringify(publicSettingsObject?.value)}`}
        </Script>
        <Providers publicSettings={publicSettingsObject?.value}>
          {children}
        </Providers>
    </body>
    </html>
  );
}