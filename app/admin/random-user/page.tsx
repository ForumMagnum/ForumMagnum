import React from "react";
import RandomUserPage from '@/components/admin/RandomUserPage';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Random User',
  });
}

export default function Page() {
  return <RouteRoot>
    <RandomUserPage />
  </RouteRoot>
}
