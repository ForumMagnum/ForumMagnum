import React from "react";
import BestOfLessWrongAdmin from '@/components/review/BestOfLessWrongAdmin';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge(defaultMetadata, {
    title: 'Best of LessWrong Admin',
  });
}

export default function Page() {
  return <BestOfLessWrongAdmin />;
}
