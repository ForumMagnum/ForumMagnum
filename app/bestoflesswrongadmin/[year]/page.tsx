import React from "react";
import BestOfLessWrongAdmin from '@/components/review/BestOfLessWrongAdmin';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Best of LessWrong Admin',
  });
}

export default function Page() {
  return <BestOfLessWrongAdmin />;
}
