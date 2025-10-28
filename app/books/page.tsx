import React from "react";
import Books from '@/components/sequences/Books';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Books'));
}

export default function Page() {
  return <RouteRoot>
    <Books />
  </RouteRoot>
}
