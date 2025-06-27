import { TagBySlugQueryOptions, useTagBySlug } from "../tagging/useTag";
import { hasWikiLenses } from "@/lib/betas";
import { type ErrorLike } from "@apollo/client";
import { useQuery } from "@/lib/crud/useQuery"
import { gql } from "@/lib/generated/gql-codegen";
import type { tagBySlugQueries } from "../tagging/tagBySlugQueries";
import { ResultOf } from "@graphql-typed-document-node/core";

const MultiDocumentParentDocumentMultiQuery = gql(`
  query multiMultiDocumentuseTagOrLensQuery($selector: MultiDocumentSelector, $limit: Int, $enableTotal: Boolean) {
    multiDocuments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...MultiDocumentParentDocument
      }
      totalCount
    }
  }
`);

export function useTagOrLens<TagFragmentTypeName extends keyof typeof tagBySlugQueries>(
  slug: string,
  tagFragmentName: TagFragmentTypeName,
  tagQueryOptions: TagBySlugQueryOptions,
): {
  tag: NonNullable<ResultOf<typeof tagBySlugQueries[TagFragmentTypeName]>['tags']>['results'][number] | null,
  loadingTag: boolean,
  tagError?: ErrorLike | null,
  refetchTag: () => Promise<unknown>,
  lens: MultiDocumentParentDocument|null,
  loadingLens: boolean,
  lensError?: ErrorLike | null,
} {
  const { tag, loading: loadingTag, error: tagError, refetch: refetchTag } = useTagBySlug(slug, tagFragmentName, tagQueryOptions);

  const { data, error: lensError, loading: loadingLens } = useQuery(MultiDocumentParentDocumentMultiQuery, {
    variables: {
      selector: { lensBySlug: { slug: slug } },
      limit: 10,
      enableTotal: false,
    },
    // Having a limit of 1 makes this fail if we have copies of this lens for deleted tags which don't get returned for permissions reasons
    // so we get as many as we can and assume that we'll only ever actually get at most one back
    skip: !hasWikiLenses || !slug,
    notifyOnNetworkStatusChange: true,
  });

  const lensWithParentTag = data?.multiDocuments?.results;

  return {
    tag,
    loadingTag,
    tagError,
    refetchTag,
    lens: lensWithParentTag?.[0] ?? null,
    loadingLens,
    lensError,
  };
}

