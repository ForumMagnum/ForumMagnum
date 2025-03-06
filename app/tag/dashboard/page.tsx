"use client";

import TaggingDashboard from '@/components/tagging/TaggingDashboard';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Tag Dashboard</title></Helmet>
      <TaggingDashboard />
    </>
  );
}
