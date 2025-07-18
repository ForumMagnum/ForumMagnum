import React from "react";
import MigrationsDashboard from '@/components/admin/migrations/MigrationsDashboard';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge(defaultMetadata, {
    title: 'Migrations',
  });
}

export default function Page() {
  return <MigrationsDashboard />;
}
