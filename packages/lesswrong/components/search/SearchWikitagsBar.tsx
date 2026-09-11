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
    gap: 4,
    flexWrap: "wrap",
    flex: 1,
    minWidth: 0,
  },
  tags: {
    flex: '1 1 140px',
    minWidth: 0,
    '& .TagMultiselect-inputContainer': {marginBottom: 0, boxSizing: 'border-box'},
    '& input': {minWidth: 0, boxSizing: 'border-box'},
  },
  match: {display: 'flex', gap: 2},
}));

/** Filters to content tagged with the chosen wikitags, including the wikitags themselves. */
const SearchWikitagsBar = ({tagIds, onChange, match, onMatchChange}: {
  tagIds: string[],
  match: SearchTagMatch,
  onMatchChange: (match: SearchTagMatch) => void,
  onChange: (tagIds: string[]) => void,
}) => {
  const classes = useStyles(styles);
  return <div className={classes.root} role="group" aria-label="Wikitags">
    <div className={classes.tags}>
      <TagMultiselect
        value={tagIds}
        placeholder="Filter by wikitags"
        hidePostCount
        startWithBorder
        updateCurrentValues={onChange}
      />
    </div>
    <div className={classes.match} role="group" aria-label="Match wikitags">
      <SearchChip selected={match === "any"} onToggle={() => onMatchChange("any")}>Any</SearchChip>
      <SearchChip selected={match === "all"} onToggle={() => onMatchChange("all")}>All</SearchChip>
    </div>
  </div>;
};

export default SearchWikitagsBar;
