import React from "react";
import GroupsMap from '@/components/localGroups/GroupsMap';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Groups Map',
  });
}

export default function Page() {
  return <RouteRoot>
    <GroupsMap />
  </RouteRoot>
}
