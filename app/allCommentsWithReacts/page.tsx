"use client";

import AllReactedCommentsPage from '@/components/sunshineDashboard/AllReactedCommentsPage';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>All Comments with Reacts</title></Helmet>
      <AllReactedCommentsPage />
    </>
  );
}
