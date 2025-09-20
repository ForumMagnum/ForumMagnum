import React from "react";
import EventsUpcoming from '@/components/posts/EventsUpcoming';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Upcoming Events by Day',
  });
}

export default function Page() {
  return <RouteRoot>
    <EventsUpcoming />
  </RouteRoot>
}
