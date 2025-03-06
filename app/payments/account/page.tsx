"use client";

import EditPaymentInfoPage from '@/components/payments/EditPaymentInfoPage';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Account Payment Info</title></Helmet>
      <EditPaymentInfoPage />
    </>
  );
}
