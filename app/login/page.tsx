import React from "react";
import LoginPage from '@/components/users/LoginPage';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Login'));
}

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ background: 'white' }} />
    <LoginPage />
  </>;
}
