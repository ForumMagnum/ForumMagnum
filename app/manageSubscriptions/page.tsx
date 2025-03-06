"use client";

import ViewSubscriptionsPage from '@/components/users/ViewSubscriptionsPage';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Manage Subscriptions</title></Helmet>
      <ViewSubscriptionsPage />
    </>
  );
}
