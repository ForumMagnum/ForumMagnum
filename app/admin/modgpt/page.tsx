import React from "react";
import ModGPTDashboard from '@/components/sunshineDashboard/ModGPTDashboard';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge(defaultMetadata, {
    title: 'ModGPT Dashboard',
  });
}

export default function Page() {
  return <ModGPTDashboard />;
}
