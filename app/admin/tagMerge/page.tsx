import React from "react";
import TagMergePage from '@/components/tagging/TagMergePage';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Wikitag merging tool',
  });
}

export default function Page() {
  return <TagMergePage />;
}
