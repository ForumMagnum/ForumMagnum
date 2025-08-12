import React from "react";
import AllGroupsPage from '@/components/localGroups/AllGroupsPage';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'All Local Groups',
  });
}

export default function Page() {
  return <AllGroupsPage />;
}
