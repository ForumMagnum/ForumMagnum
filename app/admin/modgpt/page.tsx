import React from "react";
import ModGPTDashboard from '@/components/sunshineDashboard/ModGPTDashboard';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'ModGPT Dashboard',
  });
}

export default function Page() {
  return <ModGPTDashboard />;
}
