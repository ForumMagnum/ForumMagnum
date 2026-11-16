import React from 'react';
import type { Metadata } from 'next';
import { globalExternalStylesheets } from '@/themes/globalStyles/externalStyles';
import LWThemeProvider from '../src/components/LWThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'SimpleMod',
  description: 'One item at a time moderation',
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <head>
        {globalExternalStylesheets.map(stylesheet => <link key={stylesheet} rel="stylesheet" href={stylesheet} />)}
        <script id="jss-insertion-start" />
        <script id="jss-insertion-end" />
      </head>
      <body>
        <LWThemeProvider>{children}</LWThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
