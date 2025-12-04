import React from "react";
import PostCollaborationEditor from '@/components/editor/PostCollaborationEditor';
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteHasWhiteBackground } from "@/components/layout/routeBackgroundColors";

assertRouteHasWhiteBackground("/collaborateOnPost");

export default function Page() {
  return <RouteRoot
    delayedStatusCode
  >
    <PostCollaborationEditor />
  </RouteRoot>;
}
