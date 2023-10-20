import { useMulti, UseMultiOptions } from '../../lib/crud/withMulti';

export const useTagBySlug = <FragmentTypeName extends keyof FragmentTypes>(
  slug: string,
  fragmentName: FragmentTypeName,
  queryOptions?: Partial<UseMultiOptions<FragmentTypeName, "Tags">>
): {
  tag: FragmentTypes[FragmentTypeName]|null,
  loading: boolean,
  error: any
} => {
  const { results, loading, error } = useMulti<FragmentTypeName, "Tags">({
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
    };
  } else {
    return {
      tag: null,
      loading, error
    };
  }
}

type TagPreviewFragmentName = 'TagPreviewFragment' | 'TagSectionPreviewFragment';

export const useTagPreview = (
  slug: string,
  hash: string,
  queryOptions?: Partial<Omit<UseMultiOptions<TagPreviewFragmentName, "Tags">, 'extraVariables' | 'extraVariablesValues'>>
): {
  tag: FragmentTypes[TagPreviewFragmentName]|null,
  loading: boolean,
  error: any
} => {
  const fragmentName = hash
    ? 'TagSectionPreviewFragment'
    : 'TagPreviewFragment';

  const hashVariables = hash
    ? { extraVariables: { hash: "String" }, extraVariablesValues: { hash } }
    : {};

  const { results, loading, error } = useMulti<TagPreviewFragmentName, "Tags">({
    terms: {
      view: "tagBySlug",
      slug: slug
    },
    collectionName: "Tags",
    fragmentName: fragmentName,
    limit: 1,
    ...hashVariables,
    ...queryOptions
  });
  
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
