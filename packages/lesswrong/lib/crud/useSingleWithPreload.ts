import { useApolloClient } from "@apollo/client";
import { getFragment } from "../vulcan-lib/fragments";
import { collectionNameToTypeName } from "../generated/collectionTypeNames";
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
  ssr=true,
}: {
  collectionName: CollectionName;
  fragmentName: FragmentName;
  preloadFragmentName: PreloadFragmentName;
  documentId: string;
  ssr?: boolean,
}) {
  const apolloClient = useApolloClient();

  const typeName = collectionNameToTypeName[collectionName];

  const cachedResult = apolloClient.cache.readFragment<FragmentTypes[PreloadFragmentName]>({
    fragment: getFragment(preloadFragmentName),
    fragmentName: preloadFragmentName,
    id: `${typeName}:`+documentId,
  });

  const fetchedResult = useSingle({
    documentId,
    collectionName,
    fragmentName,
    ssr,
  });

  return {
    bestResult: fetchedResult.document ?? cachedResult,
    cachedResult,
    fetchedResult,
  };
}
