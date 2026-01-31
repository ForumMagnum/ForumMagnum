import React from "react";
import QuestionsPage from '@/components/questions/QuestionsPage';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('All Questions'));
}

export default function Page() {
  return <RouteRoot hasLeftNavigationColumn>
    <QuestionsPage />
  </RouteRoot>;
}
