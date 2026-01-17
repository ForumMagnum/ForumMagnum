import React from "react";
import ReviewTopPostsList from "./ReviewTopPostsList";
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Review Top Nominations',
  });
}

export default function Page() {
  return <RouteRoot metadata={{ subtitle: 'Review Top Nominations' }}>
    <ReviewTopPostsList />
  </RouteRoot>;
}
