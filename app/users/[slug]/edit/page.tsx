import React from "react";
import UsersAccount from '@/components/users/account/UsersAccount';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Account Settings',
  });
}

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ background: 'white' }} />
    <UsersAccount />
  </>;
}
