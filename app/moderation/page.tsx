"use client";

import ModerationLog from '@/components/sunshineDashboard/moderationLog/ModerationLog';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Moderation Log</title></Helmet>
      <ModerationLog />
    </>
  );
}
