import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";

const HeaderEventSubtitleSpotlightQuery = gql(`
  query HeaderEventSubtitleSpotlightQuery($selector: SpotlightSelector, $limit: Int) {
    spotlights(selector: $selector, limit: $limit) {
      results {
        ...SpotlightHeaderEventSubtitle
      }
    }
  }
`);

const DisplaySpotlightQuery = gql(`
  query DisplaySpotlightQuery($selector: SpotlightSelector, $limit: Int) {
    spotlights(selector: $selector, limit: $limit) {
      results {
        ...SpotlightDisplay
      }
    }
  }
`);

type ConditionalSpotlightReturnType<T extends 'SpotlightHeaderEventSubtitle' | 'SpotlightDisplay'> = T extends 'SpotlightHeaderEventSubtitle'
  ? SpotlightHeaderEventSubtitle
  : SpotlightDisplay;

export const useCurrentFrontpageSpotlight = <FragmentTypeName extends 'SpotlightHeaderEventSubtitle' | 'SpotlightDisplay'>({fragmentName, skip}: {
  fragmentName: FragmentTypeName,
  skip?: boolean,
}): ConditionalSpotlightReturnType<FragmentTypeName> | undefined => {
  const queryToUse = fragmentName === "SpotlightHeaderEventSubtitle" ? HeaderEventSubtitleSpotlightQuery : DisplaySpotlightQuery;
  const { data } = useQuery<HeaderEventSubtitleSpotlightQueryQuery | DisplaySpotlightQueryQuery>(queryToUse, {
    variables: {
      selector: { mostRecentlyPromotedSpotlights: { limit: 1 } },
    },
    skip,
    notifyOnNetworkStatusChange: true,
  });

  const currentSpotlightResults = data?.spotlights?.results;
  return currentSpotlightResults?.[0] as ConditionalSpotlightReturnType<FragmentTypeName> | undefined;
}
