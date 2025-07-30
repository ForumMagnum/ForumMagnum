import React from "react";
import ModerationTemplatesPage from '@/components/moderationTemplates/ModerationTemplatesPage';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge({}, defaultMetadata, {
    title: 'Moderation Message Templates',
  });
}

export default function Page() {
  return <ModerationTemplatesPage />;
}
