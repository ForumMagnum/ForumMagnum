import React from "react";
import Books from '@/components/sequences/Books';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge({}, defaultMetadata, {
    title: 'Books',
  });
}

export default function Page() {
  return <Books />;
}
