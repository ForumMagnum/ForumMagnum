import React from "react";
import RandomTagPage from '@/components/tagging/RandomTagPage';
import RouteRoot from "@/components/layout/RouteRoot";


export default function Page() {
  return <RouteRoot delayedStatusCode>
    <RandomTagPage />
  </RouteRoot>
}
