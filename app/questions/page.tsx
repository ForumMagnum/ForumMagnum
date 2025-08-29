import React from "react";
import QuestionsPage from '@/components/questions/QuestionsPage';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'All Questions',
  });
}

export default function Page() {
  return <RouteRoot metadata={{ hasLeftNavigationColumn: true }}>
    <QuestionsPage />
  </RouteRoot>;
}
