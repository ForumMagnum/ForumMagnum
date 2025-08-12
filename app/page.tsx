import React from "react";
import LWHome from "@/components/common/LWHome";
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return await getDefaultMetadata();
}

export default async function Home() {
  return <>
    <RouteMetadataSetter metadata={{ hasLeftNavigationColumn: true }} />
    <LWHome />
  </>;
}
