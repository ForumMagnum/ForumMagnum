import { gql } from "@/lib/generated/gql-codegen";
import { getDefaultMetadata, getMetadataDescriptionFields, getMetadataImagesFields, getPageTitleFields, getResolverContextForGenerateMetadata, handleMetadataError, noIndexMetadata } from "./sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import { cloudinaryCloudNameSetting, siteNameWithArticleSetting, taglineSetting } from "@/lib/instanceSettings";
import { userGetDisplayName } from "@/lib/collections/users/helpers";
import { captureException } from "@/lib/sentryWrapper";
import { notFound } from "next/navigation";
import { runQuery } from "@/stubs/server/vulcan-lib/query";

const UserMetadataQuery = gql(`
  query UserMetadata($slug: String) {
    users(selector: { usersProfile: { slug: $slug } }) {
      results {
        _id
        displayName
        username
        slug
        profileImageId
        postCount
        commentCount
        karma
        noindex
      }
    }
  }
`);

export async function generateUserPageMetadata({ params, searchParams }: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{}>,
}): Promise<Metadata> {
  const [paramValues, searchParamsValues, defaultMetadata] = await Promise.all([params, searchParams, getDefaultMetadata()]);
  const resolverContext = await getResolverContextForGenerateMetadata(searchParamsValues);

  try {
    const { data } = await runQuery(
      UserMetadataQuery,
      { slug: paramValues.slug },
      resolverContext
    );
  
    const user = data?.users?.results?.[0];
  
    if (!user) return notFound();
  
    const displayName = userGetDisplayName(user);
    const description = `${displayName}'s profile on ${siteNameWithArticleSetting.get()} — ${taglineSetting.get()}`;
    const descriptionFields = getMetadataDescriptionFields(description);
  
    const titleFields = getPageTitleFields(user.displayName ?? user.slug);
  
    const imageUrl = user.profileImageId
      ? `https://res.cloudinary.com/${cloudinaryCloudNameSetting.get()}/image/upload/c_crop,g_custom,q_auto,f_auto/${user.profileImageId}.jpg`
      : '';
  
    const imageFields = getMetadataImagesFields(imageUrl);
  
    const noIndexUser = (!user.postCount && !user.commentCount) || user.karma <= 0 || user.noindex;
    const noIndexFields = noIndexUser ? noIndexMetadata : {};
  
    return merge({}, defaultMetadata, descriptionFields, titleFields, imageFields, noIndexFields);  
  } catch (error) {
    return handleMetadataError('Error generating user page metadata', error);
  }
}
