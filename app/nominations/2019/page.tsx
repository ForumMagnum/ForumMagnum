import React from "react";
import Nominations2019 from '@/components/review/Nominations2019';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: '2019 Nominations',
  });
}

export default function Page() {
  return <Nominations2019 />;
}
