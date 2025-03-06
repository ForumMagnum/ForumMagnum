"use client";

import AdminSynonymsPage from '@/components/admin/AdminSynonymsPage';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Search Synonyms</title></Helmet>
      <AdminSynonymsPage />
    </>
  );
}
