import { getClient } from "@/lib/apollo/nextApolloClient";
import { gql } from "@/lib/generated/gql-codegen";
import type { Metadata } from "next";
import { CommentPermalinkMetadataQuery, getCommentDescription, getDefaultMetadata, getMetadataDescriptionFields, getPageTitleFields, noIndexMetadata } from "./sharedMetadata";
import merge from "lodash/merge";
import { captureException } from "@/lib/sentryWrapper";

const TagMetadataQuery = gql(`
  query TagMetadata($tagSlug: String) {
    tags(selector: { tagBySlug: { slug: $tagSlug } }) {
      results {
        _id
        name
        noindex
        description {
          _id
          plaintextDescription
        }
      }
    }
  }
`);

interface TagPageMetadataOptions {
  historyPage?: boolean;
  noIndex?: boolean;
}

export function getTagPageMetadataFunction<Params>(paramsToTagSlugConverter: (params: Params) => string, options?: TagPageMetadataOptions) {
  return async function generateMetadata({ params, searchParams }: { params: Promise<Params>, searchParams: Promise<{ commentId?: string }> }): Promise<Metadata> {
    const [paramValues, searchParamsValues, defaultMetadata] = await Promise.all([params, searchParams, getDefaultMetadata()]);

    const slug = paramsToTagSlugConverter(paramValues);
    const commentId = searchParamsValues.commentId;

    const client = getClient();

    try {
      const [{ data }, { data: commentData }] = await Promise.all([
        client.query({
        query: TagMetadataQuery,
        variables: {
          tagSlug: slug,
        },
      }),
      commentId
        ? client.query({
            query: CommentPermalinkMetadataQuery,
            variables: { commentId },
          })
        : { data: null },
      ]);
  
      const tag = data?.tags?.results?.[0];
      const comment = commentData?.comment?.result;

      if (!tag) return {};
  
      const tagPageTitle = options?.historyPage ? `${tag.name} - History` : tag.name;
      const titleFields = getPageTitleFields(tagPageTitle);
  
      const description = comment
        ? getCommentDescription(comment)
        : tag.description?.plaintextDescription ?? `All posts related to ${tag.name}, sorted by relevance`;

      const noIndex = tag.noindex || commentId || options?.noIndex;
  
      const descriptionFields = getMetadataDescriptionFields(description);
      const noIndexFields = noIndex ? noIndexMetadata : {};
  
      const tagMetadata = {
        ...titleFields,
        ...noIndexFields,
      } satisfies Metadata;
  
      return merge({}, defaultMetadata, tagMetadata, descriptionFields);
    } catch (error) {
      //eslint-disable-next-line no-console
      console.error('Error generating tag page metadata:', error);
      captureException(error);
      return {};
    }
  }
}
