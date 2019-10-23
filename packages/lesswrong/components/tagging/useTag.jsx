import { useMulti } from 'meteor/vulcan:core';
import { Tags } from '../../lib/collections/tags/collection.js';

export const useTag = (tagName) => {
  const { results, loading, error } = useMulti({
    terms: {
      view: "tagByName",
      name: tagName
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

export default useTag;
