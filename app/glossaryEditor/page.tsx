import React from "react";
import GlossaryEditorPage from '@/components/jargon/GlossaryEditorPage';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge(defaultMetadata, {
    title: 'Glossary Editor',
  });
}

export default function Page() {
  return <GlossaryEditorPage />;
}
