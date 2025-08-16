import React from "react";
import CurationPage from '@/components/admin/CurationPage';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Curation Dashboard',
    robots: { index: false },
  });
}

export default function Page() {
  return <CurationPage />;
}
