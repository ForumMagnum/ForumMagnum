import React from "react";
import Nominations2018 from '@/components/review/Nominations2018';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: '2018 Nominations',
  });
}

export default function Page() {
  return <Nominations2018 />;
}
