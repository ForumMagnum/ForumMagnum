import React from "react";
import PostCollaborationEditor from '@/components/editor/PostCollaborationEditor';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";


export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ background: 'white' }} />
    <PostCollaborationEditor />
  </>;
}
