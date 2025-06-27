import React from "react";
import LocalGroupSingle from '@/components/localGroups/LocalGroupSingle';
import { LocalgroupPageTitle } from '@/components/titles/LocalgroupPageTitle';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { gql } from "@/lib/generated/gql-codegen";
import type { Metadata } from "next";
import { getClient } from "@/lib/apollo/nextApolloClient";
import { getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";

const LocalgroupMetadataQuery = gql(`
  query LocalgroupMetadata($groupId: String) {
    localgroup(selector: { _id: $groupId }) {
      result {
        _id
        name
      }
    }
  }
`);

export async function generateMetadata({ params }: { params: Promise<{ groupId: string }> }): Promise<Metadata> {
  const paramValues = await params;

  const client = getClient();

  const { data } = await client.query({
    query: LocalgroupMetadataQuery,
    variables: {
      groupId: paramValues.groupId,
    },
  });

  const localgroup = data?.localgroup?.result;

  if (!localgroup) return {};

  const titleFields = getPageTitleFields(localgroup.name);

  return { ...titleFields };
}

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
