"use client";

import ModGPTDashboard from '@/components/sunshineDashboard/ModGPTDashboard';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>ModGPT Dashboard</title></Helmet>
      <ModGPTDashboard />
    </>
  );
}
