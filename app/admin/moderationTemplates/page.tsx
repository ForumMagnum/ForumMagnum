import React from "react";
import ModerationTemplatesPage from '@/components/moderationTemplates/ModerationTemplatesPage';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Moderation Message Templates'));
}

export default function Page() {
  return <RouteRoot>
    <ModerationTemplatesPage />
  </RouteRoot>
}
