import { ApolloError, useQuery } from '@apollo/client';
import { gql } from '@/lib/generated/gql-codegen';
import { hasWikiLenses } from '@/lib/betas';
import intersection from 'lodash/intersection';
import pick from 'lodash/pick';
import { tagBySlugQueries } from './tagBySlugQueries';
import { ResultOf } from '@graphql-typed-document-node/core';

export interface TagBySlugQueryOptions {
  extraVariables?: {
    version?: string,
    contributorsLimit?: number,
    lensSlug?: string,
  },
  skip?: boolean,
}

export const useTagBySlug = <FragmentTypeName extends keyof typeof tagBySlugQueries>(
  slug: string,
  fragmentName: FragmentTypeName,
  queryOptions?: TagBySlugQueryOptions
): {
  tag: NonNullable<ResultOf<typeof query>['tags']>['results'][number] | null,
  loading: boolean,
  error?: ApolloError | null,
  refetch: () => Promise<unknown>,
} => {
  const query = tagBySlugQueries[fragmentName];
  const { extraVariables, skip } = queryOptions ?? {};

  const { data, loading, error, refetch } = useQuery<ResultOf<typeof query>>(query, {
    variables: {
      selector: { tagBySlug: { slug } },
      limit: 1,
      ...extraVariables,
    },
    skip,
  });

  const results = data?.tags?.results;

  if (results && results.length>0 && (results[0] as HasIdType)._id) {
    return {
      tag: results[0],
      loading: false,
      error: null,
      refetch,
    };
  } else {
    return {
      tag: null,
      loading, error,
      refetch,
    };
  }
}

type TagPreviewFragmentName = 'TagPreviewFragment' | 'TagSectionPreviewFragment';

type CommonTagLensFields = Pick<TagPreviewFragment, Exclude<keyof MultiDocumentContentDisplay & keyof TagPreviewFragment, '__typename'>>;

const tagOrLensPreviewQuery = gql(`
  query getTagOrLensPreview($slug: String!, $hash: String) {
    TagPreview(slug: $slug, hash: $hash) {
      tag {
        ...TagPreviewFragment
      }
      lens {
        ...MultiDocumentContentDisplay
      }
      summaries {
        ...MultiDocumentContentDisplay
      }
    }
  }
`);

const tagOrLensSectionPreviewQuery = gql(`
  query getTagOrLensSectionPreview($slug: String!, $hash: String) {
    TagPreview(slug: $slug, hash: $hash) {
      tag {
        ...TagSectionPreviewFragment
      }
      lens {
        ...MultiDocumentContentDisplay
      }
      summaries {
        ...MultiDocumentContentDisplay
      }
    }
  }
`);

const tagPreviewQuery = gql(`
  query getTagPreview($selector: TagSelector, $limit: Int) {
    tags(selector: $selector, limit: $limit) {
      results {
        ...TagPreviewFragment
      }
    }
  }
`);

const tagSectionPreviewQuery = gql(`
  query getTagSectionPreview($selector: TagSelector, $limit: Int, $hash: String) {
    tags(selector: $selector, limit: $limit) {
      results {
        ...TagSectionPreviewFragment
      }
    }
  }
`);

export const useTagPreview = (
  slug: string,
  hash?: string,
  skip?: boolean,
): {
  tag: (FragmentTypes[TagPreviewFragmentName] & { summaries?: MultiDocumentContentDisplay[] }) | null,
  loading: boolean,
  error: any
} => {
  const { query, queryWithLens, ...hashVariables } = hash
    ? { query: tagSectionPreviewQuery, queryWithLens: tagOrLensSectionPreviewQuery, hash }
    : { query: tagPreviewQuery, queryWithLens: tagOrLensPreviewQuery };

  const {
    data: dataWithLenses,
    loading: queryLoadingWithLenses,
    error: queryErrorWithLenses
  } = useQuery<getTagOrLensPreviewQuery | getTagOrLensSectionPreviewQuery>(queryWithLens, {
    skip: skip || !hasWikiLenses,
    variables: { ...hashVariables, slug }
  });

  const {
    data: dataWithoutLenses,
    loading: queryLoadingWithoutLenses,
    error: queryErrorWithoutLenses
  } = useQuery(query, {
    variables: {
      selector: { tagBySlug: { slug } },
      limit: 1,
      ...hashVariables,
    },
    skip: skip || hasWikiLenses,
  });

  if (hasWikiLenses) {
    if (dataWithLenses?.TagPreview?.tag) {
      const originalTag = dataWithLenses.TagPreview.tag;
      const lens: MultiDocumentContentDisplay | null = dataWithLenses.TagPreview.lens;
      const summaries: MultiDocumentContentDisplay[] = dataWithLenses.TagPreview.summaries;

      let preview: (TagPreviewFragment | TagSectionPreviewFragment) & { summaries: MultiDocumentContentDisplay[] };

      if (lens) {
        const tagKeys = Object.keys(originalTag);
        const lensKeys = Object.keys(lens);
        const overlappingKeys = intersection(tagKeys, lensKeys) as (keyof CommonTagLensFields)[];
        const overlappingFields: CommonTagLensFields = pick(lens, overlappingKeys);
        preview = {
          ...originalTag,
          ...overlappingFields,
          description: lens.contents,
          summaries,
        };
      } else {
        preview = { ...originalTag, summaries };
      }

      return {
        tag: preview,
        loading: false,
        error: null,
      }
    } else {
      return {
        tag: null,
        loading: queryLoadingWithLenses,
        error: queryErrorWithLenses
      };
    }
  }

  const results = dataWithoutLenses?.tags?.results;
  
  if (results && results.length>0 && (results[0] as HasIdType)._id) {
    return {
      tag: results[0] as FragmentTypes[TagPreviewFragmentName]|null,
      loading: false,
      error: null,
    };
  } else {
    return {
      tag: null,
      loading: queryLoadingWithoutLenses,
      error: queryErrorWithoutLenses,
    };
  }
}
