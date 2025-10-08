import React, { useState, useEffect, useRef } from "react";
import type { Command } from "@ckeditor/ckeditor5-core";
import { defineStyles, useStyles } from '../hooks/useStyles';

const styles = defineStyles('EditorCommandPalette', (theme: ThemeType) => ({
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.palette.greyAlpha(0.5),
    zIndex: 10000,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: '10vh',
  },
  container: {
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.borderRadius.default,
    boxShadow: theme.shadows[3],
    width: '500px',
    maxHeight: '400px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  searchInput: {
    padding: '12px 16px',
    border: 'none',
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
    fontSize: '16px',
    outline: 'none',
    backgroundColor: 'transparent',
    '&:focus': {
      borderBottomColor: theme.palette.primary.main,
    },
  },
  commandList: {
    maxHeight: '300px',
    overflowY: 'auto',
    padding: '8px 0',
  },
  commandItem: {
    padding: '8px 16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '14px',
    '&:hover': {
      backgroundColor: theme.palette.grey[100],
    },
    '&.selected': {
      backgroundColor: theme.palette.primary.light,
      color: theme.palette.primary.contrastText,
    },
  },
  commandName: {
    fontWeight: 500,
  },
  commandDescription: {
    fontSize: '12px',
    color: theme.palette.grey[600],
    marginLeft: '8px',
  },
  emptyState: {
    padding: '16px',
    textAlign: 'center',
    color: theme.palette.grey[600],
    fontSize: '14px',
  },
}));

const EditorCommandPalette = ({ commandsByName, onClose }: { commandsByName: Record<string, Command>, onClose: () => void }) => {
  const classes = useStyles(styles);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const commandListRef = useRef<HTMLDivElement>(null);

  // Focus the search input when the component mounts
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Filter commands based on search query
  const filteredCommands = Object.entries(commandsByName).filter(([name]) => {
    if (!searchQuery) return true;
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Reset selected index when search query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          const [commandName, command] = filteredCommands[selectedIndex];
          command.execute();
          onClose();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = commandListRef.current?.children[selectedIndex] as HTMLElement;
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Handle click outside to close
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={classes.overlay} onClick={handleOverlayClick}>
      <div className={classes.container}>
        <input
          ref={searchInputRef}
          className={classes.searchInput}
          type="text"
          placeholder="Search commands..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className={classes.commandList} ref={commandListRef}>
          {filteredCommands.length > 0 ? (
            filteredCommands.map(([commandName, command], index) => (
              <div
                key={commandName}
                className={`${classes.commandItem} ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => {
                  command.execute();
                  onClose();
                }}
              >
                <div className={classes.commandName}>
                  {commandName}
                </div>
                {command.value !== undefined && (
                  <div className={classes.commandDescription}>
                    {String(command.value)}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className={classes.emptyState}>
              {searchQuery ? 'No commands found' : 'No commands available'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditorCommandPalette;
