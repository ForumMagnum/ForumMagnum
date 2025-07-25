import { getClient } from "@/lib/apollo/nextApolloClient";
import { gql } from "@/lib/generated/gql-codegen";
import type { Metadata } from "next";
import { defaultMetadata, getMetadataDescriptionFields, getPageTitleFields } from "./sharedMetadata";
import merge from "lodash/merge";
import { captureException } from "@sentry/nextjs";

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
  return async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
    const paramValues = await params;

    const slug = paramsToTagSlugConverter(paramValues);

    const client = getClient();

    try {
      const { data } = await client.query({
        query: TagMetadataQuery,
        variables: {
          tagSlug: slug,
        },
      });
  
      const tag = data?.tags?.results?.[0];
  
      if (!tag) return {};
  
      const tagPageTitle = options?.historyPage ? `${tag.name} - History` : tag.name;
      const titleFields = getPageTitleFields(tagPageTitle);
  
      const description = tag.description?.plaintextDescription ?? `All posts related to ${tag.name}, sorted by relevance`;
      const noIndex = tag.noindex || options?.noIndex;
  
      const descriptionFields = getMetadataDescriptionFields(description);
      const noIndexFields = noIndex ? { robots: { index: false } } : {};
  
      const tagMetadata = {
        ...titleFields,
        ...noIndexFields,
      } satisfies Metadata;
  
      return merge(defaultMetadata, tagMetadata, descriptionFields);
    } catch (error) {
      //eslint-disable-next-line no-console
      console.error('Error generating tag page metadata:', error);
      captureException(error);
      return {};
    }
  }
}