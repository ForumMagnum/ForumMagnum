import React from "react";
import LWHome from "@/components/common/LWHome";
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";

export const dynamic = 'force-dynamic';

export default function Home() {
  return <>
    <RouteMetadataSetter metadata={{ hasLeftNavigationColumn: true }} />
    <LWHome />
  </>;
}