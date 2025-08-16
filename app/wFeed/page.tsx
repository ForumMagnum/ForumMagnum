import React from "react";
import TagActivityFeed from '@/components/tagging/TagActivityFeed';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Wikitag Activity',
  });
}

export default function Page() {
  return <TagActivityFeed />;
}
