import React from "react";
import CommunityHome from '@/components/localGroups/CommunityHome';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Community',
  });
}

export default function Page() {
  return <CommunityHome />;
}
