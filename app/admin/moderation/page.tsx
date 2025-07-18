import React from "react";
import ModerationDashboard from '@/components/sunshineDashboard/ModerationDashboard';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge(defaultMetadata, {
    title: 'Moderation Dashboard',
  });
}

export default function Page() {
  return <ModerationDashboard />;
}
