import React from "react";
import UsersAccount from '@/components/users/account/UsersAccount';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteHasWhiteBackground } from "@/components/layout/routeBackgroundColors";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Account Settings'));
}

assertRouteHasWhiteBackground("/account");

export default function Page() {
  return <RouteRoot>
    <UsersAccount />
  </RouteRoot>;
}
