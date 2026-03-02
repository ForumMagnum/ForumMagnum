import React from "react";
import SequencesSingleV2 from "../../../../packages/lesswrong/components/sequences/SequencesSingleV2";
import { SequencesPageSubtitle } from '@/components/titles/SequencesPageSubtitle';
import type { Metadata } from "next";
import { getDefaultMetadata, getMetadataDescriptionFields, getMetadataImagesFields, getPageTitleFields, getResolverContextForGenerateMetadata, handleMetadataError } from "@/server/pageMetadata/sharedMetadata";
import merge from "lodash/merge";
import { combineUrls, getSiteUrl } from "@/lib/vulcan-lib/utils";
import RouteRoot from "@/components/layout/RouteRoot";
import { notFound } from "next/navigation";
import { makeCloudinaryImageUrl } from "@/components/common/cloudinaryHelpers";
import { runQuery } from "@/server/vulcan-lib/query";

const SequenceMetadataQuery = `
  query SequenceMetadataV2($sequenceId: String) {
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
`;

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
  
    const ogUrl = combineUrls(getSiteUrl(), `/s/${_id}/v2`);
    const canonicalUrl = combineUrls(getSiteUrl(), `/s/${_id}/v2`);

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
    return handleMetadataError('Error generating sequence v2 page metadata', error);
  }
}

export default function Page() {
  return <RouteRoot delayedStatusCode subtitle={SequencesPageSubtitle}>
    <SequencesSingleV2 />
  </RouteRoot>;
}
