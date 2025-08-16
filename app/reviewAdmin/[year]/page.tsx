import React from "react";
import ReviewAdminDashboard from '@/components/review/ReviewAdminDashboard';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Review Admin Dashboard',
  });
}

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ isAdmin: true }} />
    <ReviewAdminDashboard />
  </>;
}
