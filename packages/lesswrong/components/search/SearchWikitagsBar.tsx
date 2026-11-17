import React from 'react';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import { maxSearchFilterIds, SearchTagMatch } from '@/lib/search/searchFilters';
import SearchSegmentedControl, { SearchSegment } from './SearchSegmentedControl';
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
    '& .TagMultiselect-inputContainer': {
      marginBottom: 0,
      boxSizing: 'border-box',
      padding: '0 12px',
      border: 'none',
      borderRadius: 3,
      backgroundColor: theme.palette.background.paper,
      transition: 'background-color 150ms',
      '&:focus-within': {backgroundColor: theme.palette.greyAlpha(0.04)},
    },
    '& input': {
      minWidth: 0,
      minHeight: 40,
      boxSizing: 'border-box',
      border: 'none',
      borderRadius: 3,
      outline: 'none',
      background: 'transparent',
    },
  },
}));

const tagMatchSegments: SearchSegment<SearchTagMatch>[] = [
  {value: "any", label: "Any", ariaLabel: "Match any wikitag"},
  {value: "all", label: "All", ariaLabel: "Match all wikitags"},
];

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
        maxCount={maxSearchFilterIds}
      />
    </div>
    <SearchSegmentedControl label="Match wikitags" segments={tagMatchSegments} value={match} onChange={onMatchChange} />
  </div>;
};

export default SearchWikitagsBar;
