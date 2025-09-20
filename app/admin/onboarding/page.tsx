import React from "react";
import AdminViewOnboarding from '@/components/admin/AdminViewOnboarding';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Onboarding (for testing purposes)',
  });
}

export default function Page() {
  return <RouteRoot>
    <AdminViewOnboarding />
  </RouteRoot>
}
