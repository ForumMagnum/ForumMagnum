import React from "react";
import AIDetectionComparisonPage from '@/components/admin/AIDetectionComparisonPage';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'AI Detection Comparison',
  });
}

export default function Page() {
  return <RouteRoot>
    <AIDetectionComparisonPage />
  </RouteRoot>
}
