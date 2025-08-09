import React from "react";
import CurationPage from '@/components/admin/CurationPage';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge({}, defaultMetadata, {
    title: 'Curation Dashboard',
    robots: { index: false },
  });
}

export default function Page() {
  return <CurationPage />;
}
