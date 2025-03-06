"use client";

import ReviewAdminDashboard from '@/components/review/ReviewAdminDashboard';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Review Admin Dashboard</title></Helmet>
      <ReviewAdminDashboard />
    </>
  );
}
