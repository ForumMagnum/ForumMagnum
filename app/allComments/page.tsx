import React from "react";
import AllComments from '@/components/comments/AllComments';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge({}, defaultMetadata, {
    title: 'All Comments',
  });
}

export default function Page() {
  // enableResourcePrefetch was: true
  
  return <AllComments />;
}
