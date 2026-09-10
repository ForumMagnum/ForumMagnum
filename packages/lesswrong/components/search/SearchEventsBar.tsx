import React from 'react';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import { SearchEventFilter } from '@/lib/search/searchFilters';
import SearchChip from './SearchChip';

const styles = defineStyles("SearchEventsBar", () => ({
  root: {display: "flex", gap: 4, flexWrap: "wrap"},
}));

const SearchEventsBar = ({value, onChange}: {
  value: SearchEventFilter,
  onChange: (value: SearchEventFilter) => void,
}) => {
  const classes = useStyles(styles);
  return <div className={classes.root} role="group" aria-label="Events">
    <SearchChip selected={value === "include"} onToggle={() => onChange("include")}>Include events</SearchChip>
    <SearchChip selected={value === "exclude"} onToggle={() => onChange("exclude")}>Exclude events</SearchChip>
    <SearchChip selected={value === "only"} onToggle={() => onChange("only")}>Only events</SearchChip>
  </div>;
};

export default SearchEventsBar;
