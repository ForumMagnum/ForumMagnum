import React from "react";
import LWHome from "@/components/common/LWHome";
import RouteRoot from "@/components/next/RouteRoot";

export default async function Home() {
  return <RouteRoot metadata={{ hasLeftNavigationColumn: true }}>
    <LWHome />
  </RouteRoot>;
}
