import React from 'react';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import { SearchTagMatch } from '@/lib/search/searchFilters';
import SearchChip from './SearchChip';
import TagMultiselect from '../form-components/TagMultiselect';

const styles = defineStyles("SearchWikitagsBar", (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    flex: 1,
    minWidth: 0,
  },
}));

/** Restricts posts, comments and users to the chosen wikitags. */
const SearchWikitagsBar = ({tagIds, onChange, match, onMatchChange}: {
  tagIds: string[],
  match: SearchTagMatch,
  onMatchChange: (match: SearchTagMatch) => void,
  onChange: (tagIds: string[]) => void,
}) => {
  const classes = useStyles(styles);
  return <div className={classes.root} role="group" aria-label="Wikitags">
    <TagMultiselect
      value={tagIds}
      placeholder="Filter by wikitags"
      hidePostCount
      startWithBorder
      updateCurrentValues={onChange}
    />
    <SearchChip selected={match === "any"} onToggle={() => onMatchChange("any")}>Match any</SearchChip>
    <SearchChip selected={match === "all"} onToggle={() => onMatchChange("all")}>Match all</SearchChip>
  </div>;
};

export default SearchWikitagsBar;
