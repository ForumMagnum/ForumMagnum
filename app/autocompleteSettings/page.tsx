import React from "react";
import AutocompleteModelSettings from '@/components/languageModels/AutocompleteModelSettings';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'LLM Autocomplete Model Settings',
  });
}

export default function Page() {
  return <AutocompleteModelSettings />;
}
