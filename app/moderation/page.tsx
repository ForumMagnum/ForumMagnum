import React from "react";
import ModerationLog from '@/components/sunshineDashboard/moderationLog/ModerationLog';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge(defaultMetadata, {
    title: 'Moderation Log',
    robots: { index: false },
  });
}

export default function Page() {
  return <ModerationLog />;
}
