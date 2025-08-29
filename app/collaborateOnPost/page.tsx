import React from "react";
import PostCollaborationEditor from '@/components/editor/PostCollaborationEditor';
import RouteRoot from "@/components/next/RouteRoot";


export default function Page() {
  return <RouteRoot metadata={{ background: 'white' }}>
    <PostCollaborationEditor />
  </RouteRoot>;
}
