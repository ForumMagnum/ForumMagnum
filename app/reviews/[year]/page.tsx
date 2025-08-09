import React from "react";
import AnnualReviewPage from '@/components/review/AnnualReviewPage';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge({}, defaultMetadata, {
    title: 'Reviews',
  });
}

export default function Page() {
  return <AnnualReviewPage />;
}
