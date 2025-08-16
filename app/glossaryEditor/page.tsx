import React from "react";
import GlossaryEditorPage from '@/components/jargon/GlossaryEditorPage';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Glossary Editor',
  });
}

export default function Page() {
  return <GlossaryEditorPage />;
}
