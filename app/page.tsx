import React from "react";
import LWHome from "@/components/common/LWHome";
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import RouteRoot from "@/components/next/RouteRoot";

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return await getDefaultMetadata();
}

export default async function Home() {
  return <RouteRoot metadata={{ hasLeftNavigationColumn: true }}>
    <LWHome />
  </RouteRoot>;
}
