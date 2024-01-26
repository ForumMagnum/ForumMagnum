import { useMulti } from "../../lib/crud/withMulti";

export const useCurrentFrontpageSpotlight = <FragmentTypeName extends FragmentTypesByCollection["Spotlights"]>({fragmentName, skip}: {
  fragmentName: FragmentTypeName,
  skip?: boolean,
}): FragmentTypes[FragmentTypeName] | undefined => {
  const {results: currentSpotlightResults} = useMulti({
    collectionName: "Spotlights",
    fragmentName: fragmentName,
    terms: {
      view: "mostRecentlyPromotedSpotlights",
      limit: 1,
    },
    skip,
  });
  return currentSpotlightResults?.[0];
}
