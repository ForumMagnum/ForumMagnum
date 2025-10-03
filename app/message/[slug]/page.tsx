import React from "react";
import MessageUser from '@/components/messaging/MessageUser';
import RouteRoot from "@/components/next/RouteRoot";


export default function Page() {
  return <RouteRoot delayedStatusCode>
    <MessageUser />
  </RouteRoot>
}
