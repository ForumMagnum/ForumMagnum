import React from "react";
import SequencesSingle from '@/components/sequences/SequencesSingle';
import { SequencesPageTitle } from '@/components/titles/SequencesPageTitle';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import type { Metadata } from "next";
import { gql } from "@/lib/generated/gql-codegen";
import { getClient } from "@/lib/apollo/nextApolloClient";
import { getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";

const SequenceMetadataQuery = gql(`
  query SequenceMetadata($sequenceId: String) {
    sequence(selector: { _id: $sequenceId }) {
      result {
        _id
        title
      }
    }
  }
`);

export async function generateMetadata({ params }: { params: Promise<{ _id: string }> }): Promise<Metadata> {
  const paramValues = await params;

  const client = getClient();

  const { data } = await client.query({
    query: SequenceMetadataQuery,
    variables: {
      sequenceId: paramValues._id,
    },
  });

  const sequence = data?.sequence?.result;

  if (!sequence) return {};

  const titleFields = getPageTitleFields(sequence.title);

  return { ...titleFields };
}

export default function Page() {
  // enableResourcePrefetch was: function
  
  return <>
    <RouteMetadataSetter metadata={{
      titleComponent: SequencesPageTitle,
      subtitleComponent: SequencesPageTitle
    }} />
    <SequencesSingle />
  </>;
}
