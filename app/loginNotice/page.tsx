import React from "react";
import LoginNotice from '@/components/users/LoginNotice';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), await getPageTitleFields('Login'));
}

assertRouteAttributes("/loginNotice", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export default async function Page({ searchParams }: {
  searchParams: Promise<{ error?: string, warning?: string, returnTo?: string }>
}) {
  const { error, warning, returnTo } = await searchParams;
  return <RouteRoot>
    <LoginNotice error={error} warning={warning} returnTo={returnTo} />
  </RouteRoot>;
}
