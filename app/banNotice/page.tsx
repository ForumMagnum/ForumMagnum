import React from "react";
import BannedNotice from '@/components/users/BannedNotice';
import RouteRoot from "@/components/layout/RouteRoot";


export default function Page() {
  return <RouteRoot>
    <BannedNotice />;
  </RouteRoot>
}
