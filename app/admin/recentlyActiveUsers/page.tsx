"use client";

import RecentlyActiveUsers from '@/components/sunshineDashboard/ModeratorUserInfo/RecentlyActiveUsers';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Recently Active Users</title></Helmet>
      <RecentlyActiveUsers />
    </>
  );
}
