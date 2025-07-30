import React from "react";
import EventsPast from '@/components/posts/EventsPast';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge({}, defaultMetadata, {
    title: 'Past Events by Day',
  });
}

export default function Page() {
  return <EventsPast />;
}
