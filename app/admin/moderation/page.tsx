"use client";

import ModerationDashboard from '@/components/sunshineDashboard/ModerationDashboard';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Moderation Dashboard</title></Helmet>
      <ModerationDashboard />
    </>
  );
}
