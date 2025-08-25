import React from "react";
import TagVoteActivity from '@/components/tagging/TagVoteActivity';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Wikitag Voting Activity',
  });
}

export default function Page() {
  return <TagVoteActivity />;
}
