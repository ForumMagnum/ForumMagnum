import React from "react";
import RecentlyActiveUsers from '@/components/sunshineDashboard/ModeratorUserInfo/RecentlyActiveUsers';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Recently Active Users',
  });
}

export default function Page() {
  return <RouteRoot>
    <RecentlyActiveUsers />
  </RouteRoot>
}
