import React from "react";
import LocalGroupSingle from '@/components/localGroups/LocalGroupSingle';
import { LocalgroupPageTitle } from '@/components/titles/LocalgroupPageTitle';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import type { Metadata } from "next";

// TODO: This route has both a titleComponent and static metadata ({ subtitle: 'Community' })!  You will need to manually merge the two.

export async function generateMetadata({ params }: { params: Promise<{ groupId: string }> }): Promise<Metadata> { /* TODO: fill this in! */ }

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{
      subtitle: 'Community',
      subtitleLink: '/community',
      titleComponent: LocalgroupPageTitle
    }} />
    <LocalGroupSingle />
  </>;
}
