import React from "react";
import ArbitalExplorePage from '@/components/tagging/ArbitalExplorePage';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge(defaultMetadata, {
    title: 'Arbital',
  });
}

export default function Page() {
  return <ArbitalExplorePage />;
}
