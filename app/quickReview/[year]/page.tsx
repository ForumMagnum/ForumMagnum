import React from "react";
import AnnualReviewPage from '@/components/review/AnnualReviewPage';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Review Quick Page',
  });
}

export default function Page() {
  return <RouteRoot metadata={{ subtitle: 'Quick Review Page' }}>
    <AnnualReviewPage />
  </RouteRoot>;
}
