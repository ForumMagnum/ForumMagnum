import { useMulti } from '../../lib/crud/withMulti';
import { Tags } from '../../lib/collections/tags/collection';

export const useTagBySlug = (slug: string): {
  tag: TagFragment|null,
  loading: boolean,
  error: any
}=> {
  const { results, loading, error } = useMulti({
    terms: {
      view: "tagBySlug",
      slug: slug
    },
    collection: Tags,
    fragmentName: "TagFragment",
    limit: 1,
    ssr: true,
  });
  
  if (results && results.length>0 && results[0]._id) {
    return {
      tag: results[0],
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
