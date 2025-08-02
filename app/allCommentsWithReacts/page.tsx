import React from "react";
import AllReactedCommentsPage from '@/components/sunshineDashboard/AllReactedCommentsPage';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge({}, defaultMetadata, {
    title: 'All Comments with Reacts',
  });
}

export default function Page() {
  return <AllReactedCommentsPage />;
}
