import React from "react";
import UsersSingle from '@/components/users/UsersSingle';
import { UserPageTitle } from '@/components/titles/UserPageTitle';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { generateUserPageMetadata } from "@/server/pageMetadata/userPageMetadata";

export const generateMetadata = generateUserPageMetadata;

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ titleComponent: UserPageTitle }} />
    <UsersSingle />
  </>;
}
