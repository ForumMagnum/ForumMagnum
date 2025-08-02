import React from "react";
import RecommendationsPage from '@/components/recommendations/RecommendationsPage';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge({}, defaultMetadata, {
    title: 'Recommendations',
  });
}

export default function Page() {
  return <RecommendationsPage />;
}
