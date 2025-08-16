import React from "react";
import RecentlyActiveUsers from '@/components/sunshineDashboard/ModeratorUserInfo/RecentlyActiveUsers';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Recently Active Users',
  });
}

export default function Page() {
  return <RecentlyActiveUsers />;
}
