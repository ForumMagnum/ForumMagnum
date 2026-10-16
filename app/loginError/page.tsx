import React from "react";
import LoginErrorNotice from '@/components/users/LoginErrorNotice';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), await getPageTitleFields('Login Error'));
}

assertRouteAttributes("/loginError", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export default async function Page({ searchParams }: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams;
  return <RouteRoot>
    <LoginErrorNotice error={error} />
  </RouteRoot>;
}
