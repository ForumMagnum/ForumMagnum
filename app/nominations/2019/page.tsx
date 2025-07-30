import React from "react";
import Nominations2019 from '@/components/review/Nominations2019';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge({}, defaultMetadata, {
    title: '2019 Nominations',
  });
}

export default function Page() {
  return <Nominations2019 />;
}
