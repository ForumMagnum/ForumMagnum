"use client";

import SpreadsheetPage from '@/components/posts/SpreadsheetPage';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>COVID-19 Link Database</title></Helmet>
      <SpreadsheetPage />
    </>
  );
}
