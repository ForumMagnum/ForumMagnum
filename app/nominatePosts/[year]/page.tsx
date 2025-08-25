import React from "react";
import AnnualReviewPage from '@/components/review/AnnualReviewPage';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Nominate Posts',
  });
}

export default function Page() {
  return <AnnualReviewPage />;
}
