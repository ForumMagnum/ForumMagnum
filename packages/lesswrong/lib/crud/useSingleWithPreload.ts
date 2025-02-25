import { useApolloClient } from "@apollo/client";
import { getFragment } from "../vulcan-lib/fragments";
import { collectionNameToTypeName } from "../vulcan-lib/getCollection";
import { useSingle } from "./withSingle";

export function useSingleWithPreload<
  CollectionName extends keyof FragmentTypesByCollection & CollectionNameString,
  FragmentName extends FragmentTypesByCollection[CollectionName],
  PreloadFragmentName extends FragmentTypesByCollection[CollectionName]
>({
  collectionName,
  fragmentName,
  preloadFragmentName,
  documentId,
}: {
  collectionName: CollectionName;
  fragmentName: FragmentName;
  preloadFragmentName: PreloadFragmentName;
  documentId: string;
}) {
  const apolloClient = useApolloClient();

  const typeName = collectionNameToTypeName(collectionName);

  const cachedResult = apolloClient.cache.readFragment<FragmentTypes[PreloadFragmentName]>({
    fragment: getFragment(preloadFragmentName),
    fragmentName: preloadFragmentName,
    id: `${typeName}:`+documentId,
  });

  const fetchedResult = useSingle({
    documentId,
    collectionName,
    fragmentName,
  });

  return {
    bestResult: fetchedResult.document ?? cachedResult,
    cachedResult,
    fetchedResult,
  };
}
