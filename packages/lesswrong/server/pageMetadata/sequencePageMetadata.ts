import { gql } from "@/lib/generated/gql-codegen";
import { getDefaultMetadata, getMetadataDescriptionFields, getMetadataImagesFields, getPageTitleFields, getResolverContextForGenerateMetadata, handleMetadataError } from "./sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import { combineUrls, getSiteUrl } from "@/lib/vulcan-lib/utils";
import { sequenceGetPageUrl } from "@/lib/collections/sequences/helpers";
import { notFound } from "next/navigation";
import { makeCloudinaryImageUrl } from "@/components/common/cloudinaryHelpers";
import { runQuery } from "@/server/vulcan-lib/query";

const SequenceMetadataQuery = gql(`
  query SequenceMetadata($idOrSlug: String) {
    sequence(selector: { idOrSlug: $idOrSlug }) {
      result {
        _id
        slug
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

export async function generateSequencePageMetadata({ params, searchParams }: {
  params: Promise<{ _id: string }>
  searchParams: Promise<{}>,
}): Promise<Metadata> {
  const { _id } = await params;
  const resolverContext = await getResolverContextForGenerateMetadata(await searchParams);

  try {
    const { data } = await runQuery(
      SequenceMetadataQuery,
      { idOrSlug: _id },
      resolverContext
    );

    const sequence = data?.sequence?.result;

    if (!sequence) return notFound();

    const titleFields = getPageTitleFields(sequence.title);

    const canonicalUrl = sequenceGetPageUrl(sequence, { isAbsolute: true });
    const ogUrl = combineUrls(getSiteUrl(), canonicalUrl);

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
