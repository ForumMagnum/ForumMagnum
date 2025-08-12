import React from "react";
import AllComments from '@/components/comments/AllComments';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'All Comments',
  });
}

export default function Page() {
  // enableResourcePrefetch was: true
  
  return <AllComments />;
}
