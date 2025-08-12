import React from "react";
import UsersSingle from '@/components/users/UsersSingle';
import { UserPageTitle } from '@/components/titles/UserPageTitle';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { generateUserPageMetadata } from "@/server/pageMetadata/userPageMetadata";

// eslint-disable-next-line no-barrel-files/no-barrel-files
export { generateUserPageMetadata as generateMetadata };

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ titleComponent: UserPageTitle }} />
    <UsersSingle />
  </>;
}
