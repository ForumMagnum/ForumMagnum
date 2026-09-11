import React from 'react';
import classNames from 'classnames';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import { SearchPostType, searchPostTypeLabels, defaultSearchPostTypes } from '@/lib/search/searchFilters';
import SearchChip from './SearchChip';

const styles = defineStyles("SearchPostTypeBar", (theme: ThemeType) => ({
  root: {
    display: "flex",
    gap: 4,
    overflowX: "auto",
  },
}));

export function togglePostType(selected: SearchPostType[], type: SearchPostType): SearchPostType[] {
  const next = selected.includes(type) ? selected.filter(item => item !== type) : [...selected, type];
  // Deselecting the last type means every type, shown as every chip selected.
  return next.length ? next : defaultSearchPostTypes;
}

/** Which non-event posts to include. Other content kinds stay selected. */
const SearchPostTypeBar = ({selected, onChange, className}: {
  selected: SearchPostType[],
  onChange: (types: SearchPostType[]) => void,
  className?: string,
}) => {
  const classes = useStyles(styles);
  return <div className={classNames(classes.root, className)} role="group" aria-label="Post types">
    {defaultSearchPostTypes.map(type => <SearchChip
      key={type}
      selected={selected.includes(type)}
      onToggle={() => onChange(togglePostType(selected, type))}
    >
      {searchPostTypeLabels[type]}
    </SearchChip>)}
  </div>;
};

export default SearchPostTypeBar;
