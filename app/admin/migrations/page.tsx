"use client";

import MigrationsDashboard from '@/components/admin/migrations/MigrationsDashboard';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Migrations</title></Helmet>
      <MigrationsDashboard />
    </>
  );
}
