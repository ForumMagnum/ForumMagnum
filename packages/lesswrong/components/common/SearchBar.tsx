"use client";

import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useOnNavigate } from '../hooks/useOnNavigate';
import IconButton from '@/lib/vendor/@material-ui/core/src/IconButton';
import withErrorBoundary from './withErrorBoundary';
import { isSearchEnabled } from '../../lib/search/searchUtil';
import ForumIcon from './ForumIcon';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import { useGlobalKeydown } from './withGlobalKeydown';
import SearchModal from '../search/SearchModal';

const styles = defineStyles('SearchBar', (theme: ThemeType) => ({
  root: {display: 'flex', alignItems: 'center', minWidth: 48, flexShrink: 0},
  searchIcon: {'--icon-size': '24px'},
  searchIconButton: {color: theme.palette.header.text, flexShrink: 0},
}));

const SearchBar = ({onSetIsActive}: {
  onSetIsActive: (active: boolean) => void,
}) => {
  const classes = useStyles(styles);
  const [inputOpen, setInputOpen] = useState(false);
  const closeSearch = () => {
    setInputOpen(false);
    onSetIsActive(false);
  };
  const handleSearchTap = () => {
    setInputOpen(true);
    onSetIsActive(true);
  };
  useOnNavigate(closeSearch);

  useGlobalKeydown((event) => {
    if (event.defaultPrevented || !isSearchEnabled() || event.isComposing
      || !(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey
      || event.key.toLowerCase() !== 'k') {
      return;
    }
    // Preserve rich-text editors' Cmd/Ctrl+K shortcut for inserting links.
    if (event.target instanceof HTMLElement && event.target.isContentEditable) {
      return;
    }
    event.preventDefault();
    if (event.repeat) return;
    if (inputOpen) {
      closeSearch();
    } else {
      handleSearchTap();
    }
  });

  if (!isSearchEnabled()) return null;

  return <div className={classes.root}>
    <IconButton aria-label="Search" aria-haspopup="dialog" aria-expanded={inputOpen}
      onClick={handleSearchTap} className={classes.searchIconButton}>
      <ForumIcon icon="Search" className={classes.searchIcon} />
    </IconButton>
    {inputOpen && <SearchModal onClose={closeSearch} />}
  </div>;
};

export default registerComponent('SearchBar', SearchBar, {
  hocs: [withErrorBoundary],
  areEqual: 'auto',
});
