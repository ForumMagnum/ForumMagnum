import React from "react";
import SequencesSingle from '@/components/sequences/SequencesSingle';
import { SequencesPageTitle } from '@/components/titles/SequencesPageTitle';
import type { Metadata } from "next";
import { gql } from "@/lib/generated/gql-codegen";
import { getDefaultMetadata, getMetadataDescriptionFields, getMetadataImagesFields, getPageTitleFields, getResolverContextForGenerateMetadata, handleMetadataError } from "@/server/pageMetadata/sharedMetadata";
import merge from "lodash/merge";
import { combineUrls, getSiteUrl } from "@/lib/vulcan-lib/utils";
import { sequenceGetPageUrl } from "@/lib/collections/sequences/helpers";
import RouteRoot from "@/components/layout/RouteRoot";
import { notFound } from "next/navigation";
import { makeCloudinaryImageUrl } from "@/components/common/cloudinaryHelpers";
import { runQuery } from "@/server/vulcan-lib/query";

const SequenceMetadataQuery = gql(`
  query SequenceMetadata($sequenceId: String) {
    sequence(selector: { _id: $sequenceId }) {
      result {
        _id
        title
        bannerImageId
        gridImageId
        noindex
        contents {
          plaintextDescription
        }
      }
    }
  }
`);

export async function generateMetadata({ params, searchParams }: {
  params: Promise<{ _id: string }>
  searchParams: Promise<{}>,
 }): Promise<Metadata> {
  const { _id } = await params;
  const resolverContext = await getResolverContextForGenerateMetadata(await searchParams);

  try {
    const { data } = await runQuery(
      SequenceMetadataQuery,
      { sequenceId: _id },
      resolverContext
    );
  
    const sequence = data?.sequence?.result;
  
    if (!sequence) return notFound();
  
    const titleFields = getPageTitleFields(sequence.title);
  
    const ogUrl = combineUrls(getSiteUrl(), `/s/${_id}`);
    const canonicalUrl = sequenceGetPageUrl({ _id }, true);

    const socialImageId = sequence.gridImageId || sequence.bannerImageId;
    const socialImageUrl = socialImageId ? makeCloudinaryImageUrl(socialImageId, {
      c: "fill",
      dpr: "auto",
      q: "auto",
      f: "auto",
      g: "auto:faces",
    }) : undefined;

    return merge({},
      await getDefaultMetadata(),
      titleFields,
      getMetadataImagesFields(socialImageUrl ?? null),
      getMetadataDescriptionFields(sequence.contents?.plaintextDescription ?? null),
      {
        openGraph: { url: ogUrl },
        alternates: { canonical: canonicalUrl },
        robots: {
          index: !sequence.noindex,
        },
      } satisfies Metadata
    );
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
