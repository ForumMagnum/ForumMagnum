import React from "react";
import AdminSynonymsPage from '@/components/admin/AdminSynonymsPage';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Search Synonyms'));
}

export default function Page() {
  return <RouteRoot>
    <AdminSynonymsPage />
  </RouteRoot>
}
