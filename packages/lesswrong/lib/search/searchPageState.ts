import type { SearchState } from "react-instantsearch/connectors";
import type { SearchIndexCollectionName } from "./searchUtil";

export type ExpandedSearchState = SearchState & {
  contentType?: SearchIndexCollectionName;
  refinementList?: {
    tags: Array<string> | "";
  };
};

export const resetSearchPage = (
  searchState: ExpandedSearchState,
): ExpandedSearchState => ({
  ...searchState,
  page: 0,
});
