import { useMulti } from '../../lib/crud/withMulti';
import { GardenCodes } from '../../lib/collections/gardencodes/collection';

export const useGardenCodeBySlug = <FragmentTypeName extends keyof FragmentTypes>(slug: string, fragmentName: FragmentTypeName, queryOptions:any=null): {
  gardenCode: FragmentTypes[FragmentTypeName]|null,
  loading: boolean,
  error: any
} => {
  const { results, loading, error } = useMulti({
    terms: {
      view: "gardenCodeBySlug",
      slug: slug
    },
    collection: GardenCodes,
    fragmentName: fragmentName,
    limit: 1,
    ssr: true,
    ...queryOptions
  });

  if (results && results.length>0 && (results[0] as HasIdType)._id) {
    return {
      gardenCode: results[0] as FragmentTypes[FragmentTypeName]|null,
      loading: false,
      error: null,
    };
  } else {
    return {
      gardenCode: null,
      loading, error
    };
  }
}
