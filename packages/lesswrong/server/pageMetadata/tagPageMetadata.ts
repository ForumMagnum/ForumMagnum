import { getClient } from "@/lib/apollo/nextApolloClient";
import { gql } from "@/lib/generated/gql-codegen";
import type { Metadata } from "next";
import { CommentPermalinkMetadataQuery, getCommentDescription, getDefaultMetadata, getMetadataDescriptionFields, getPageTitleFields, handleMetadataError, noIndexMetadata } from "./sharedMetadata";
import merge from "lodash/merge";
import { notFound } from "next/navigation";
import { tagGetDiscussionUrl, tagGetHistoryUrl, tagGetUrl } from "@/lib/collections/tags/helpers";
import { combineUrls, getSiteUrl } from "@/lib/vulcan-lib/utils";

const TagMetadataQuery = gql(`
  query TagMetadata($tagSlug: String) {
    tags(selector: { tagBySlug: { slug: $tagSlug } }) {
      results {
        _id
        name
        slug
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
  discussionPage?: boolean;
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

      // We can't return a `notFound()` here, because we need to return a RedLinkTagPage rather than the default not-found.
      if (!tag) return defaultMetadata;
  
      const tagPageTitle = options?.historyPage ? `${tag.name} - History` : tag.name;
      const titleFields = getPageTitleFields(tagPageTitle);
  
      const description = comment
        ? getCommentDescription(comment)
        : tag.description?.plaintextDescription ?? `All posts related to ${tag.name}, sorted by relevance`;

      const noIndex = tag.noindex || commentId || options?.noIndex;
  
      const descriptionFields = getMetadataDescriptionFields(description);
      const noIndexFields = noIndex ? noIndexMetadata : {};

      const urlBase = options?.historyPage
        ? tagGetHistoryUrl(tag)
        : options?.discussionPage
          ? tagGetDiscussionUrl(tag)
          : tagGetUrl(tag);

      const ogUrl = combineUrls(getSiteUrl(), urlBase);
      const canonicalUrl = ogUrl;

      const urlFields = {
        openGraph: {
          url: ogUrl,
        },
        alternates: {
          canonical: canonicalUrl,
        },
      };
  
      return merge({}, defaultMetadata, titleFields, noIndexFields, descriptionFields, urlFields);
    } catch (error) {
      return handleMetadataError('Error generating tag page metadata', error);
    }
  }
}
