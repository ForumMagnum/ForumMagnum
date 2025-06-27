import React from "react";
import ReviewAdminDashboard from '@/components/review/ReviewAdminDashboard';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge(defaultMetadata, {
    title: 'Review Admin Dashboard',
  });
}

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ isAdmin: true }} />
    <ReviewAdminDashboard />
  </>;
}
