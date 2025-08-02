import React from "react";
import TagVoteActivity from '@/components/tagging/TagVoteActivity';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge({}, defaultMetadata, {
    title: 'Wikitag Voting Activity',
  });
}

export default function Page() {
  return <TagVoteActivity />;
}
