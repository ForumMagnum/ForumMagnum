import React from "react";
import MigrationsDashboard from '@/components/admin/migrations/MigrationsDashboard';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Migrations'));
}

export default function Page() {
  return <RouteRoot>
    <MigrationsDashboard />
  </RouteRoot>
}
