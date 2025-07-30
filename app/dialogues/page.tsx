import React from "react";
import DialoguesPage from '@/components/dialogues/DialoguesPage';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge({}, defaultMetadata, {
    title: 'All Dialogues',
  });
}

export default function Page() {
  return <DialoguesPage />;
}
