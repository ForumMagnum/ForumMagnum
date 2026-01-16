import React from "react";
import RandomUserPage from '@/components/admin/RandomUserPage';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Random User'));
}

export default function Page() {
  return <RouteRoot>
    <RandomUserPage />
  </RouteRoot>
}
