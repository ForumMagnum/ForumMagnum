import React from "react";
import BestOfLessWrongAdmin from '@/components/review/BestOfLessWrongAdmin';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Best of LessWrong Admin'));
}

export default async function Page({ params }: {
  params: Promise<{ year: string }>
}) {
  const { year } = await params;
  return <RouteRoot>
    <BestOfLessWrongAdmin year={year} />
  </RouteRoot>
}
