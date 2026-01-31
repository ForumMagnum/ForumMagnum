import React from "react";
import CollectionsSingle from '@/components/sequences/CollectionsSingle';
import { CollectionsPageFragmentQuery } from "@/components/sequences/queries";
import merge from "lodash/merge";
import type { Metadata } from "next";
import { getDefaultMetadata, getMetadataDescriptionFields, getMetadataImagesFields, getPageTitleFields, getResolverContextForGenerateMetadata, noIndexMetadata } from "@/server/pageMetadata/sharedMetadata";
import { taglineSetting } from "@/lib/instanceSettings";
import { makeCloudinaryImageUrl } from "@/components/common/cloudinaryHelpers";
import RouteRoot from "@/components/layout/RouteRoot";
import { runQuery } from "@/server/vulcan-lib/query";

export async function generateMetadata({ params, searchParams }: {
  params: Promise<{ _id: string }>,
  searchParams: Promise<{}>,
 }): Promise<Metadata> {
  const [{ _id }, defaultMetadata] = await Promise.all([params, getDefaultMetadata()]);

  try {
    const resolverContext = await getResolverContextForGenerateMetadata(await searchParams);
    const { data } = await runQuery(CollectionsPageFragmentQuery, { documentId: _id }, resolverContext);
  
    if (!data?.collection?.result) return {};
  
    const collection = data.collection.result;
    
    const description = collection.contents?.plaintextDescription ?? taglineSetting.get();
    const descriptionFields = getMetadataDescriptionFields(description);

    const titleFields = getPageTitleFields(collection.title);

    const noIndexFields = collection.noindex ? noIndexMetadata : {};

    const socialImageUrl = collection.gridImageId ? makeCloudinaryImageUrl(collection.gridImageId, {
      c: "fill",
      dpr: "auto",
      q: "auto",
      f: "auto",
      g: "auto:faces",
    }) : undefined;

    const imageFields = socialImageUrl ? getMetadataImagesFields(socialImageUrl) : {};
  
    return merge({}, defaultMetadata, titleFields, descriptionFields, noIndexFields, imageFields);  
  } catch (error) {
    return defaultMetadata;
  }
}

export default function Page() {
  return <RouteRoot metadata={{ hasLeftNavigationColumn: true }}>
    <CollectionsSingle />
  </RouteRoot>;
}
