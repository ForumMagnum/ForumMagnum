import { getClient } from "@/lib/apollo/nextApolloClient";
import { gql } from "@/lib/generated/gql-codegen";
import { getDefaultMetadata, getMetadataDescriptionFields, getMetadataImagesFields, getPageTitleFields, noIndexMetadata } from "./sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import { siteNameWithArticleSetting, taglineSetting } from "@/lib/instanceSettings";
import { userGetDisplayName } from "@/lib/collections/users/helpers";

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

export async function generateUserPageMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const [paramValues, defaultMetadata] = await Promise.all([params, getDefaultMetadata()]);

  const client = getClient();

  const { data } = await client.query({
    query: UserMetadataQuery,
    variables: {
      slug: paramValues.slug,
    },
  });

  const user = data?.users?.results?.[0];

  if (!user) return {};

  const displayName = userGetDisplayName(user);
  const description = `${displayName}'s profile on ${siteNameWithArticleSetting.get()} — ${taglineSetting.get()}`;
  const descriptionFields = getMetadataDescriptionFields(description);

  const titleFields = getPageTitleFields(user.displayName ?? user.slug);

  const imageUrl = user.profileImageId
    ? `https://res.cloudinary.com/cea/image/upload/c_crop,g_custom,q_auto,f_auto/${user.profileImageId}.jpg`
    : '';

  const imageFields = getMetadataImagesFields(imageUrl);

  const noIndexUser = (!user.postCount && !user.commentCount) || user.karma <= 0 || user.noindex;
  const noIndexFields = noIndexUser ? noIndexMetadata : {};

  return merge({}, defaultMetadata, descriptionFields, titleFields, imageFields, noIndexFields);
}
