import React from "react";
import EventsUpcoming from '@/components/posts/EventsUpcoming';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge({}, defaultMetadata, {
    title: 'Upcoming Events by Day',
  });
}

export default function Page() {
  return <EventsUpcoming />;
}
