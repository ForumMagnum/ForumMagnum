import React from "react";
import AutocompleteModelSettings from '@/components/languageModels/AutocompleteModelSettings';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge({}, defaultMetadata, {
    title: 'LLM Autocomplete Model Settings',
  });
}

export default function Page() {
  return <AutocompleteModelSettings />;
}
