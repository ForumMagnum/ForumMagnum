import React from "react";
import UsersSingle from '@/components/users/UsersSingle';
import { UserPageTitle } from '@/components/titles/UserPageTitle';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import type { Metadata } from "next";
import { getClient } from "@/lib/apollo/nextApolloClient";
import { gql } from "@/lib/generated/gql-codegen";
import { getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";

const UserMetadataQuery = gql(`
  query UserMetadata($slug: String) {
    users(selector: { usersProfile: { slug: $slug } }) {
      results {
        _id
        displayName
        slug
      }
    }
  }
`);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const paramValues = await params;

  const client = getClient();

  const { data } = await client.query({
    query: UserMetadataQuery,
    variables: {
      slug: paramValues.slug,
    },
  });

  const user = data?.users?.results?.[0];

  if (!user) return {};

  const titleFields = getPageTitleFields(user.displayName ?? user.slug);

  return { ...titleFields };
}

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ titleComponent: UserPageTitle }} />
    <UsersSingle />
  </>;
}
