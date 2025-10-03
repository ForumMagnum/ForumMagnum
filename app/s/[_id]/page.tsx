import React from "react";
import SequencesSingle from '@/components/sequences/SequencesSingle';
import { SequencesPageTitle } from '@/components/titles/SequencesPageTitle';
import type { Metadata } from "next";
import { gql } from "@/lib/generated/gql-codegen";
import { getClient } from "@/lib/apollo/nextApolloClient";
import { getDefaultMetadata, getPageTitleFields, handleMetadataError } from "@/server/pageMetadata/sharedMetadata";
import merge from "lodash/merge";
import { combineUrls, getSiteUrl } from "@/lib/vulcan-lib/utils";
import { sequenceGetPageUrl } from "@/lib/collections/sequences/helpers";
import RouteRoot from "@/components/next/RouteRoot";
import { notFound } from "next/navigation";

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
  const { _id } = await params;

  const client = getClient();

  try {
    const { data } = await client.query({
      query: SequenceMetadataQuery,
      variables: {
        sequenceId: _id,
      },
    });
  
    const sequence = data?.sequence?.result;
  
    if (!sequence) return notFound();
  
    const titleFields = getPageTitleFields(sequence.title);
  
    const ogUrl = combineUrls(getSiteUrl(), `/s/${_id}`);
    const canonicalUrl = sequenceGetPageUrl({ _id }, true);
  
    return merge({}, await getDefaultMetadata(), {
      ...titleFields,
      openGraph: { url: ogUrl },
      alternates: { canonical: canonicalUrl },
    });  
  } catch (error) {
    return handleMetadataError('Error generating sequence page metadata', error);
  }
}

export default function Page() {
  // enableResourcePrefetch was: function
  
  return <RouteRoot delayedStatusCode metadata={{
    titleComponent: SequencesPageTitle,
    subtitleComponent: SequencesPageTitle
  }}>
    <SequencesSingle />
  </RouteRoot>;
}
