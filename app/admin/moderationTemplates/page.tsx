import React from "react";
import ModerationTemplatesPage from '@/components/moderationTemplates/ModerationTemplatesPage';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Moderation Message Templates',
  });
}

export default function Page() {
  return <ModerationTemplatesPage />;
}
