import React from "react";
import NewLongformReviewForm from '@/components/review/NewLongformReviewForm';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('New Longform Review'));
}

export default function Page() {
  return <RouteRoot>
    <NewLongformReviewForm />
  </RouteRoot>
}
