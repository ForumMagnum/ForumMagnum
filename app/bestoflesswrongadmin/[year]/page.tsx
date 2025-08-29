import React from "react";
import BestOfLessWrongAdmin from '@/components/review/BestOfLessWrongAdmin';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Best of LessWrong Admin',
  });
}

export default function Page() {
  return <RouteRoot>
    <BestOfLessWrongAdmin />
  </RouteRoot>
}
