"use client";

import AdminPaymentsPage from '@/components/payments/AdminPaymentsPage';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Payments Admin</title></Helmet>
      <AdminPaymentsPage />
    </>
  );
}
