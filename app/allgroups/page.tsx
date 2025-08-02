import React from "react";
import AllGroupsPage from '@/components/localGroups/AllGroupsPage';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge({}, defaultMetadata, {
    title: 'All Local Groups',
  });
}

export default function Page() {
  return <AllGroupsPage />;
}
