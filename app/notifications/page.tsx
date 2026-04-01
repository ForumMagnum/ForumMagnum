import React from "react";
import type { Metadata } from "next";
import merge from "lodash/merge";
import NotificationsPage from '@/components/notifications/NotificationsPage';
import RouteRoot from "@/components/layout/RouteRoot";
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Notifications'));
}

export default function Page() {
  return <RouteRoot>
    <NotificationsPage />
  </RouteRoot>;
}
