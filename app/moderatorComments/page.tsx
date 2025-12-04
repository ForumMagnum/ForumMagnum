import React from "react";
import ModeratorComments from '@/components/comments/ModeratorComments';
import RouteRoot from "@/components/layout/RouteRoot";


export default function Page() {
  return <RouteRoot>
    <ModeratorComments />
  </RouteRoot>
}
