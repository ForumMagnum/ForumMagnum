import React from "react";
import UsersAccount from '@/components/users/account/UsersAccount';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge({}, defaultMetadata, {
    title: 'Account Settings',
  });
}

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ background: 'white' }} />
    <UsersAccount />
  </>;
}
