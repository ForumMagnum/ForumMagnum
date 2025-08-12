import React from "react";
import ModerationDashboard from '@/components/sunshineDashboard/ModerationDashboard';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Moderation Dashboard',
  });
}

export default function Page() {
  return <ModerationDashboard />;
}
