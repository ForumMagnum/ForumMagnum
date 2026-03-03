import React from "react";
import LoginPage from '@/components/users/LoginPage';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Login'));
}

assertRouteAttributes("/login", {
  whiteBackground: true,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export default async function Page({ searchParams }: {
  searchParams: Promise<{ returnTo?: string }>
}) {
  const { returnTo } = await searchParams;
  return <RouteRoot>
    <LoginPage returnTo={returnTo} />
  </RouteRoot>;
}
