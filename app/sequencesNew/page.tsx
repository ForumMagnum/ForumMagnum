import React from "react";
import SequencesNewForm from '@/components/sequences/SequencesNewForm';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge({}, defaultMetadata, {
    title: 'New Sequence',
  });
}

export default function Page() {
  return <SequencesNewForm />;
}
