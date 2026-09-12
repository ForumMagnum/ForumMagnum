"use client";

import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useNavigate, useSubscribedLocation } from '@/lib/routeUtil';
import IconButton from '@/lib/vendor/@material-ui/core/src/IconButton';
import withErrorBoundary from './withErrorBoundary';
import { isSearchEnabled } from '../../lib/search/searchUtil';
import ForumIcon from './ForumIcon';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import { useGlobalKeydown } from './withGlobalKeydown';
import SearchModal from '../search/SearchModal';
import KeyboardShortcut from './KeyboardShortcut';
import { usePrimaryShortcutModifier } from '../hooks/usePrimaryShortcutModifier';

const styles = defineStyles('SearchBar', (theme: ThemeType) => ({
  root: {display: 'flex', alignItems: 'center', minWidth: 48, flexShrink: 0, marginTop: 5},
  searchIcon: {'--icon-size': '24px'},
  searchIconButton: {
    color: theme.palette.header.text,
    flexShrink: 0,
    borderRadius: 4,
    height: 36,
    padding: '6px 12px',
  },
  shortcut: {
    '&&': {
      fontSize: 12,
      letterSpacing: 'normal',
      opacity: 0.5,
      marginLeft: 0,
      padding: '2px 2px',
      color: 'inherit',
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: 0,
      boxShadow: 'none',
    },
    [theme.breakpoints.down('xs')]: {display: 'none'},
  },
  nonAppleShortcut: {
    '&&': {letterSpacing: '-1px'},
  },
  commandIcon: {
    width: 10,
    height: 10,
    flexShrink: 0,
    transform: 'translateY(-1.5px)',
  },
}));

const SearchBar = ({onSetIsActive}: {
  onSetIsActive: (active: boolean) => void,
}) => {
  const classes = useStyles(styles);
  const shortcutModifier = usePrimaryShortcutModifier();
  const navigate = useNavigate();
  const {location} = useSubscribedLocation();
  const inputOpen = new URLSearchParams(location.search).get('searchOpen') === '1';
  const [mounted, setMounted] = useState(false);
  useEffect(() => {setMounted(true);}, []);
  useEffect(() => {onSetIsActive(inputOpen);}, [inputOpen, onSetIsActive]);
  const closeSearch = () => {
    const params = new URLSearchParams(location.search);
    params.delete('searchOpen');
    navigate({...location, search: params.toString()}, {replace: true, skipRouter: true});
  };
  const handleSearchTap = () => {
    const params = new URLSearchParams(location.search);
    params.set('searchOpen', '1');
    navigate({...location, search: params.toString()}, {replace: true, skipRouter: true});
  };

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
      aria-keyshortcuts="Meta+k Control+k"
      onClick={handleSearchTap} className={classes.searchIconButton}>
      <ForumIcon icon="Search" className={classes.searchIcon} />
      <KeyboardShortcut className={classNames(classes.shortcut, {
        [classes.nonAppleShortcut]: shortcutModifier !== 'Cmd',
      })}>
        {shortcutModifier === 'Cmd' ? <>
          <svg className={classes.commandIcon} width="10" height="10" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <title>⌘</title>
            <path d="M9 7V17A3 3 0 1 1 6 14H18A3 3 0 1 1 15 17V7A3 3 0 1 1 18 10H6A3 3 0 1 1 9 7Z" />
          </svg>K
        </> : 'Ctrl+K'}
      </KeyboardShortcut>
    </IconButton>
    {mounted && inputOpen && <SearchModal key={location.pathname} onClose={closeSearch} />}
  </div>;
};

export default registerComponent('SearchBar', SearchBar, {
  hocs: [withErrorBoundary],
  areEqual: 'auto',
});
