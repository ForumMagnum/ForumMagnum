import React from "react";
import AnnualReviewPage from '@/components/review/AnnualReviewPage';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Reviews'));
}

export default function Page() {
  return <RouteRoot>
    <AnnualReviewPage />
  </RouteRoot>
}
