import React from "react";
import LWHome from "@/components/common/LWHome";
import RouteRoot from "@/components/next/RouteRoot";
import AlignmentForumHome from "@/components/alignment-forum/AlignmentForumHome";
import { forumSelect } from "@/lib/forumTypeUtils";
import EAHome from "@/components/ea-forum/EAHome";

export default async function Home() {
  const background = forumSelect({
    LessWrong: '#f8f4ee',
    EAForum: '#f6f8f9',
    AlignmentForum: undefined, // Uses theme's grey[60]
    default: '#f8f4ee',
  });
  
  return <RouteRoot metadata={{ 
    hasLeftNavigationColumn: true,
    background
  }}>
    <span/>
  </RouteRoot>;
}
