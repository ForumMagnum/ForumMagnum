import React from "react";
import LocalGroupSingle from '@/components/localGroups/LocalGroupSingle';
import { LocalgroupPageTitle } from '@/components/titles/LocalgroupPageTitle';
import { gql } from "@/lib/generated/gql-codegen";
import type { Metadata } from "next";
import { getClient } from "@/lib/apollo/nextApolloClient";
import { getDefaultMetadata, getMetadataDescriptionFields, getMetadataImagesFields, getPageTitleFields, handleMetadataError } from "@/server/pageMetadata/sharedMetadata";
import merge from "lodash/merge";
import { cloudinaryCloudNameSetting, taglineSetting } from "@/lib/instanceSettings";
import RouteRoot from "@/components/next/RouteRoot";
import { notFound } from "next/navigation";

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

export async function generateMetadata({ params }: { params: Promise<{ groupId: string }> }): Promise<Metadata> {
  const [paramValues, defaultMetadata] = await Promise.all([params, getDefaultMetadata()]);

  const client = getClient();

  try {
    const { data } = await client.query({
      query: LocalgroupMetadataQuery,
      variables: {
        groupId: paramValues.groupId,
      },
    });
  
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
    titleComponent: LocalgroupPageTitle
  }}>
    <LocalGroupSingle />
  </RouteRoot>;
}
