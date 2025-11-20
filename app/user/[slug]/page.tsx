import React from "react";
import UsersSingle from '@/components/users/UsersSingle';
import { generateUserPageMetadata } from "@/server/pageMetadata/userPageMetadata";
import RouteRoot from "@/components/layout/RouteRoot";

export const generateMetadata = generateUserPageMetadata;

export default function Page() {
  return <RouteRoot delayedStatusCode>
    <UsersSingle />
  </RouteRoot>
}
