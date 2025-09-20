import React from "react";
import ModeratorComments from '@/components/comments/ModeratorComments';
import RouteRoot from "@/components/next/RouteRoot";


export default function Page() {
  return <RouteRoot>
    <ModeratorComments />
  </RouteRoot>
}
