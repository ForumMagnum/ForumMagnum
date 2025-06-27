import React from "react";
import GroupsMap from '@/components/localGroups/GroupsMap';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge(defaultMetadata, {
    title: 'Groups Map',
  });
}

export default function Page() {
  return <GroupsMap />;
}
