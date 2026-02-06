"use client";

import React from "react";
import RouteRoot from "@/components/layout/RouteRoot";
import HomepageV2Content from "./HomepageV2Content";

export default function HomepageV2() {
  return <RouteRoot metadata={{ hasLeftNavigationColumn: true }}>
    <HomepageV2Content />
  </RouteRoot>;
}
