import React from "react";
import LoginPage from '@/components/users/LoginPage';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Login'));
}

export default function Page() {
  return <RouteRoot metadata={{ background: 'white' }}>
    <LoginPage />
  </RouteRoot>;
}
