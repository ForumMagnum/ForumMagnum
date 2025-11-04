import React from "react";
import RouteRoot from "@/components/layout/RouteRoot";

export default async function Home() {
  return <RouteRoot
    metadata={{ 
      hasLeftNavigationColumn: true,
      noFooter: true,
    }}
  >
    <span/>
  </RouteRoot>;
}
