import React from "react";
import MigrationsDashboard from '@/components/admin/migrations/MigrationsDashboard';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Migrations',
  });
}

export default function Page() {
  return <MigrationsDashboard />;
}
