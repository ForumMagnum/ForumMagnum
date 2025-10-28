import React from "react";
import CrosspostLoginPage from '@/components/users/CrosspostLoginPage';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Crosspost Login',
  });
}

export default function Page() {
  return <RouteRoot>
    <CrosspostLoginPage />
  </RouteRoot>
}
