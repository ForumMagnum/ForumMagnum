import React from "react";
import AdminSynonymsPage from '@/components/admin/AdminSynonymsPage';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge(defaultMetadata, {
    title: 'Search Synonyms',
  });
}

export default function Page() {
  return <AdminSynonymsPage />;
}
