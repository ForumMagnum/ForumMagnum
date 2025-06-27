import { getClient } from "@/lib/apollo/nextApolloClient";
import { gql } from "@/lib/generated/gql-codegen";
import type { Metadata } from "next";
import { defaultMetadata, getMetadataDescriptionFields } from "./sharedMetadata";
import merge from "lodash/merge";
import { tabLongTitleSetting, tabTitleSetting } from "@/lib/instanceSettings";

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

function getTagPageTitleString(tag: TagMetadataQuery_tags_MultiTagOutput_results_Tag, historyPage: boolean) {
  const siteName = tabTitleSetting.get() ?? tabLongTitleSetting.get();
  if (historyPage) {
    return `${tag.name} - History - ${siteName}`;
  }

  return `${tag.name} - ${siteName}`;
}

export function getTagPageMetadataFunction<Params>(paramsToTagSlugConverter: (params: Params) => string, options?: { historyPage?: boolean }) {
  return async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
    const paramValues = await params;

    const slug = paramsToTagSlugConverter(paramValues);

    const client = getClient();

    const { data } = await client.query({
      query: TagMetadataQuery,
      variables: {
        tagSlug: slug,
      },
    });

    const tag = data?.tags?.results?.[0];

    if (!tag) return {};

    const titleString = getTagPageTitleString(tag, options?.historyPage ?? false);

    const description = tag.description?.plaintextDescription ?? `All posts related to ${tag.name}, sorted by relevance`;
    const noIndex = tag.noindex;

    const descriptionFields = getMetadataDescriptionFields(description);
    const noIndexFields = noIndex ? { robots: { index: false } } : {};

    const tagMetadata = {
      title: titleString,
      openGraph: {
        title: titleString,
      },
      ...noIndexFields,
    } satisfies Metadata;

    return merge(defaultMetadata, tagMetadata, descriptionFields);
  }
}