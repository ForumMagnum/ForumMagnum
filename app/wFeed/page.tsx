import React from "react";
import TagActivityFeed from '@/components/tagging/TagActivityFeed';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge(defaultMetadata, {
    title: 'Wikitag Activity',
  });
}

export default function Page() {
  return <TagActivityFeed />;
}
