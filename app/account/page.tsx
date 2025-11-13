import React from "react";
import UsersAccount from '@/components/users/account/UsersAccount';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Account Settings',
  });
}

export default function Page() {
  return <RouteRoot metadata={{ background: 'white' }}>
    <UsersAccount />
  </RouteRoot>;
}
