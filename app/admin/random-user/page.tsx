import React from "react";
import RandomUserPage from '@/components/admin/RandomUserPage';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge({}, defaultMetadata, {
    title: 'Random User',
  });
}

export default function Page() {
  return <RandomUserPage />;
}
