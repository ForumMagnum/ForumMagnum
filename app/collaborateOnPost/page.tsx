import React from "react";
import PostCollaborationEditor from '@/components/editor/PostCollaborationEditor';
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

assertRouteAttributes("/collaborateOnPost", {
  whiteBackground: true,
  hasLinkPreview: false,
  hasPingbacks: true,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: true,
});

export default function Page() {
  return <RouteRoot
    delayedStatusCode
  >
    <PostCollaborationEditor />
  </RouteRoot>;
}
