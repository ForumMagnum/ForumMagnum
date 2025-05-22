import { useMulti, UseMultiOptions } from '../../lib/crud/withMulti';
import { useQuery } from '@apollo/client';
import { gql } from '@/lib/generated/gql-codegen';
import { hasWikiLenses } from '@/lib/betas';
import intersection from 'lodash/intersection';
import pick from 'lodash/pick';

export const useTagBySlug = <FragmentTypeName extends keyof FragmentTypes>(
  slug: string,
  fragmentName: FragmentTypeName,
  queryOptions?: Partial<UseMultiOptions<FragmentTypeName, "Tags">>
): {
  tag: FragmentTypes[FragmentTypeName]|null,
  loading: boolean,
  error: any,
  refetch: () => Promise<void>,
} => {
  const { results, loading, error, refetch } = useMulti<FragmentTypeName, "Tags">({
    terms: {
      view: "tagBySlug",
      slug: slug
    },
    collectionName: "Tags",
    fragmentName: fragmentName,
    limit: 1,
    ...queryOptions
  });
  
  if (results && results.length>0 && (results[0] as HasIdType)._id) {
    return {
      tag: results[0] as FragmentTypes[FragmentTypeName]|null,
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

const tagPreviewQuery = gql(`
  query getTagPreview($slug: String!, $hash: String) {
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

const tagSectionPreviewQuery = gql(`
  query getTagSectionPreview($slug: String!, $hash: String) {
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

export const useTagPreview = (
  slug: string,
  hash?: string,
  queryOptions?: Partial<Omit<UseMultiOptions<TagPreviewFragmentName, "Tags">, 'extraVariables' | 'extraVariablesValues'>>,
): {
  tag: (FragmentTypes[TagPreviewFragmentName] & { summaries?: MultiDocumentContentDisplay[] }) | null,
  loading: boolean,
  error: any
} => {
  const fragmentName = hash
    ? 'TagSectionPreviewFragment'
    : 'TagPreviewFragment';

  const query = hash
    ? tagSectionPreviewQuery
    : tagPreviewQuery;

  const hashVariables = hash
    ? { extraVariables: { hash: "String" }, extraVariablesValues: { hash } } as const
    : {};

  const { data, loading: queryLoading, error: queryError } = useQuery<getTagPreviewQuery | getTagSectionPreviewQuery>(query, {
    skip: queryOptions?.skip || !hasWikiLenses,
    variables: { ...hashVariables.extraVariablesValues, slug }
  })

  const { results, loading, error } = useMulti<TagPreviewFragmentName, "Tags">({
    terms: {
      view: "tagBySlug",
      slug: slug
    },
    collectionName: "Tags",
    fragmentName: fragmentName,
    limit: 1,
    ...hashVariables,
    ...queryOptions,
    skip: queryOptions?.skip || hasWikiLenses,
  });

  if (hasWikiLenses) {
    if (data?.TagPreview?.tag) {
      const originalTag = data.TagPreview.tag;
      const lens: MultiDocumentContentDisplay | null = data.TagPreview.lens;
      const summaries: MultiDocumentContentDisplay[] = data.TagPreview.summaries;

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
        loading: queryLoading,
        error: queryError
      };
    }
  }
  
  if (results && results.length>0 && (results[0] as HasIdType)._id) {
    return {
      tag: results[0] as FragmentTypes[TagPreviewFragmentName]|null,
      loading: false,
      error: null,
    };
  } else {
    return {
      tag: null,
      loading, error
    };
  }
}
