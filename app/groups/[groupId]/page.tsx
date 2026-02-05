import React from "react";
import LocalGroupSingle from '@/components/localGroups/LocalGroupSingle';
import { gql } from "@/lib/generated/gql-codegen";
import type { Metadata } from "next";
import { getDefaultMetadata, getMetadataDescriptionFields, getMetadataImagesFields, getPageTitleFields, getResolverContextForGenerateMetadata, handleMetadataError } from "@/server/pageMetadata/sharedMetadata";
import merge from "lodash/merge";
import { cloudinaryCloudNameSetting, taglineSetting } from "@/lib/instanceSettings";
import RouteRoot from "@/components/layout/RouteRoot";
import { notFound } from "next/navigation";
import { runQuery } from "@/server/vulcan-lib/query";

const LocalgroupMetadataQuery = gql(`
  query LocalgroupMetadata($groupId: String) {
    localgroup(selector: { _id: $groupId }) {
      result {
        _id
        name
        bannerImageId
        contents {
          plaintextDescription
        }
      }
    }
  }
`);

export async function generateMetadata({ params, searchParams }: { params: Promise<{ groupId: string }>, searchParams: Promise<{}> }): Promise<Metadata> {
  const [paramValues, searchParamsValues, defaultMetadata] = await Promise.all([params, searchParams, getDefaultMetadata()]);
  const resolverContext = await getResolverContextForGenerateMetadata(searchParamsValues);

  try {
    const { data } = await runQuery(
      LocalgroupMetadataQuery,
      { groupId: paramValues.groupId },
      resolverContext
    );
  
    const localgroup = data?.localgroup?.result;
  
    if (!localgroup) return notFound();
  
    const description = localgroup.contents?.plaintextDescription ?? taglineSetting.get();
    const descriptionFields = getMetadataDescriptionFields(description);
  
    const titleFields = getPageTitleFields(localgroup.name);
  
    const imageUrl = localgroup.bannerImageId
      ? `https://res.cloudinary.com/${cloudinaryCloudNameSetting.get()}/image/upload/q_auto,f_auto/${localgroup.bannerImageId}.jpg`
      : undefined;
  
    const imagesFields = imageUrl ? getMetadataImagesFields(imageUrl) : {};
  
    return merge({}, defaultMetadata, titleFields, descriptionFields, imagesFields);  
  } catch (error) {
    return handleMetadataError('Error generating local group page metadata', error);
  }
}

export default function Page() {
  return <RouteRoot delayedStatusCode metadata={{
    subtitle: 'Community',
    subtitleLink: '/community',
  }}>
    <LocalGroupSingle />
  </RouteRoot>;
}
