import React from "react";
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";
import SimpleReviewPage from "./SimpleReviewPage";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Simple Review'));
}

export default function Page() {
  return <RouteRoot>
    <SimpleReviewPage />
  </RouteRoot>
}
