import React from "react";
import UsersSingle from '@/components/users/UsersSingle';
import { UserPageTitle } from '@/components/titles/UserPageTitle';
import { generateUserPageMetadata } from "@/server/pageMetadata/userPageMetadata";
import RouteRoot from "@/components/next/RouteRoot";

export const generateMetadata = generateUserPageMetadata;

export default function Page() {
  return <RouteRoot
    delayedStatusCode
    metadata={{ titleComponent: UserPageTitle }}
  >
    <UsersSingle />
  </RouteRoot>;
}
