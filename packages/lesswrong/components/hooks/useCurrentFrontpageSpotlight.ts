import { useMulti } from "../../lib/crud/withMulti";

export const useCurrentFrontpageSpotlight = ({skip}: {
  skip?: boolean,
} = {}): SpotlightDisplay | undefined => {
  const {results: currentSpotlightResults} = useMulti({
    collectionName: "Spotlights",
    fragmentName: "SpotlightDisplay",
    terms: {
      view: "mostRecentlyPromotedSpotlights",
      limit: 1,
    },
    skip,
  });
  return currentSpotlightResults?.[0];
}
