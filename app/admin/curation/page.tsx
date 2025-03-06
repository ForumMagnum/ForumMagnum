"use client";

import CurationPage from '@/components/admin/CurationPage';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Curation Dashboard</title></Helmet>
      <CurationPage />
    </>
  );
}
