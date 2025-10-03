import React from "react";
import ReviewAdminDashboard from '@/components/review/ReviewAdminDashboard';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Review Admin Dashboard',
  });
}

export default function Page() {
  return <RouteRoot metadata={{ isAdmin: true }}>
    <ReviewAdminDashboard />
  </RouteRoot>;
}
