import React from "react";
import UsersViewABTests from '@/components/users/UsersViewABTests';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'A/B Test Groups',
  });
}

export default function Page() {
  return <RouteRoot>
    <UsersViewABTests />
  </RouteRoot>;
}
