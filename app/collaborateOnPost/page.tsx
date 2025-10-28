import React from "react";
import PostCollaborationEditor from '@/components/editor/PostCollaborationEditor';
import RouteRoot from "@/components/layout/RouteRoot";


export default function Page() {
  return <RouteRoot
    delayedStatusCode
    metadata={{ background: 'white' }}
  >
    <PostCollaborationEditor />
  </RouteRoot>;
}
