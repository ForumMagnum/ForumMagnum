import React from "react";
import NewLongformReviewForm from '@/components/review/NewLongformReviewForm';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge({}, defaultMetadata, {
    title: 'New Longform Review',
  });
}

export default function Page() {
  return <NewLongformReviewForm />;
}
