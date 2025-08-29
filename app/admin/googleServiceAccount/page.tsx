import React from "react";
import AdminGoogleServiceAccount from '@/components/admin/AdminGoogleServiceAccount';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Google Doc import service account',
  });
}

export default function Page() {
  return <RouteRoot>
    <AdminGoogleServiceAccount />
  </RouteRoot>
}
