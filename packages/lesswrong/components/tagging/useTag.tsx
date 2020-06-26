import { useMulti } from '../../lib/crud/withMulti';
import { Tags } from '../../lib/collections/tags/collection';

export const useTagBySlug = <FragmentTypeName extends keyof FragmentTypes>(slug: string, fragmentName: FragmentTypeName, queryOptions:any=null): {
  tag: FragmentTypes[FragmentTypeName]|null,
  loading: boolean,
  error: any
} => {
  const { results, loading, error } = useMulti({
    terms: {
      view: "tagBySlug",
      slug: slug
    },
    collection: Tags,
    fragmentName: fragmentName,
    limit: 1,
    ssr: true,
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
