import React from "react";
import LWHome from "@/components/common/LWHome";
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";

export const dynamic = 'force-dynamic';

export const metadata = defaultMetadata;

export default async function Home() {
  return <>
    <RouteMetadataSetter metadata={{ hasLeftNavigationColumn: true }} />
    <LWHome />
  </>;
}