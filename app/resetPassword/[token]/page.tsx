import React from "react";
import PasswordResetPage from '@/components/users/PasswordResetPage';
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";
import { getPageTitleFields, mergeMetadata } from "@/server/pageMetadata/sharedMetadata";

export const generateMetadata = () => mergeMetadata(getPageTitleFields("Reset Password"));

assertRouteAttributes("/resetPassword/[token]", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export default async function Page({ params }: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params;
  return <RouteRoot>
    <PasswordResetPage token={token} />
  </RouteRoot>
}
