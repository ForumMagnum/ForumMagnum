"use client";

import AllGroupsPage from '@/components/localGroups/AllGroupsPage';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>All Local Groups</title></Helmet>
      <AllGroupsPage />
    </>
  );
}
