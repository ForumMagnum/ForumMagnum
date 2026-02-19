import React from "react";
import EmailTokenPage from '@/components/users/EmailTokenPage';
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

assertRouteAttributes("/emailToken/[token]", {
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
    <EmailTokenPage token={token} />
  </RouteRoot>
}
