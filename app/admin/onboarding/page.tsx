"use client";

import AdminViewOnboarding from '@/components/admin/AdminViewOnboarding';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Onboarding (for testing purposes)</title></Helmet>
      <AdminViewOnboarding />
    </>
  );
}
