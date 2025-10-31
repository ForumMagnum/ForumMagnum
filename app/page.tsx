import React from "react";
import LWHome from "@/components/common/LWHome";
import RouteRoot from "@/components/next/RouteRoot";
import AlignmentForumHome from "@/components/alignment-forum/AlignmentForumHome";
import { forumSelect } from "@/lib/forumTypeUtils";
import EAHome from "@/components/ea-forum/EAHome";

export default async function Home() {
  return <RouteRoot metadata={{ hasLeftNavigationColumn: true }}>
    <span/>
  </RouteRoot>;
}
