import React from "react";
import ViewSubscriptionsPage from '@/components/users/ViewSubscriptionsPage';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Manage Subscriptions',
  });
}

export default function Page() {
  return <RouteRoot metadata={{ background: 'white' }}>
    <ViewSubscriptionsPage />
  </RouteRoot>;
}
