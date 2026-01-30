import React from "react";
import CurationPage from '@/components/admin/CurationPage';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Curation Dashboard'), {
    robots: { index: false },
  });
}

export default function Page() {
  return <RouteRoot>
    <CurationPage />
  </RouteRoot>;
}
