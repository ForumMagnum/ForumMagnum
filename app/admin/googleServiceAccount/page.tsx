"use client";

import AdminGoogleServiceAccount from '@/components/admin/AdminGoogleServiceAccount';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Google Doc import service account</title></Helmet>
      <AdminGoogleServiceAccount />
    </>
  );
}
