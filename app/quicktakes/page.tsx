import React from "react";
import ShortformPage from '@/components/shortform/ShortformPage';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Quick Takes'));
}

export default function Page() {
  return <RouteRoot>
    <ShortformPage />
  </RouteRoot>;
}
