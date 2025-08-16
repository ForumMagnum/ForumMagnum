import React from "react";
import QuestionsPage from '@/components/questions/QuestionsPage';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'All Questions',
  });
}

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ hasLeftNavigationColumn: true }} />
    <QuestionsPage />
  </>;
}
