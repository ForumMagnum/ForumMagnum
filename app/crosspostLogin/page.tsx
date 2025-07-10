import React from "react";
import CrosspostLoginPage from '@/components/users/CrosspostLoginPage';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge(defaultMetadata, {
    title: 'Crosspost Login',
  });
}

export default function Page() {
  return <CrosspostLoginPage />;
}
