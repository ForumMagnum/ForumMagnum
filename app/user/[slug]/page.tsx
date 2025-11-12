import React from "react";
import UsersSingle from '@/components/users/UsersSingle';
import { generateUserPageMetadata } from "@/server/pageMetadata/userPageMetadata";
import RouteRoot from "@/components/next/RouteRoot";
import { suggestedTimeouts } from "@/server/pageTimeouts";

export const maxDuration = suggestedTimeouts.potentiallySlowPage;

export const generateMetadata = generateUserPageMetadata;

export default function Page() {
  return <RouteRoot delayedStatusCode>
    <UsersSingle />
  </RouteRoot>
}
