import React from "react";
import RecommendationsPage from '@/components/recommendations/RecommendationsPage';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Recommendations',
  });
}

export default function Page() {
  return <RecommendationsPage />;
}
