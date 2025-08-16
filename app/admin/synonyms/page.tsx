import React from "react";
import AdminSynonymsPage from '@/components/admin/AdminSynonymsPage';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Search Synonyms',
  });
}

export default function Page() {
  return <AdminSynonymsPage />;
}
