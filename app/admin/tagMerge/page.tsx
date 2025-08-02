import React from "react";
import TagMergePage from '@/components/tagging/TagMergePage';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge({}, defaultMetadata, {
    title: 'Wikitag merging tool',
  });
}

export default function Page() {
  return <TagMergePage />;
}
