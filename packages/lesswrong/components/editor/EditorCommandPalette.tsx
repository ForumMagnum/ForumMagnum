import React, { useState, useEffect, useRef } from "react";
import type { Command, Editor } from "@ckeditor/ckeditor5-core";
import { defineStyles, useStyles } from '../hooks/useStyles';
import { getEnvKeystrokeText, type KeystrokeInfo, parseKeystroke } from "@/lib/vendor/ckeditor5-util/keyboard";
import { Typography } from "../common/Typography";
import classNames from "classnames";
import LWTooltip from "../common/LWTooltip";
import LWPopper from "../common/LWPopper";

const styles = defineStyles('EditorCommandPalette', (theme: ThemeType) => ({
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10000,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
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
    fontSize: '16px',
    outline: 'none',
    backgroundColor: 'transparent',
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
      backgroundColor: theme.palette.background.default,
      color: theme.palette.grey[600],
    },
    '&.disabled': {
      opacity: 0.4,
      cursor: 'not-allowed',
      '&:hover': {
        backgroundColor: 'transparent',
      },
    },
  },
  commandName: {
    fontWeight: 500,
  },
  keystrokeContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  keystroke: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
    height: 22,
    fontSize: '12px',
    color: theme.palette.grey[600],
    fontFamily: theme.typography.fontFamily,
    backgroundColor: theme.palette.grey[100],
    borderRadius: '4px',
    border: `1px solid ${theme.palette.grey[300]}`,
  },
  emptyState: {
    padding: '16px',
    textAlign: 'center',
    color: theme.palette.grey[600],
    fontSize: '14px',
  },
  helperTextTooltip: {
    height: '100%',
    width: '100%',
  },
}));

export interface CommandWithKeystroke {
  keystroke: string;
  label: string;
  /**
   * Some keybindings aren't linked to ckEditor "Commands", just to arbitrary plugin-related logic.
   * An example is CTRL+4 for LaTeX - it displays the math input element, but the actual "Command"
   * is for inserting LaTeX into the document after it's been put into the input element, which
   * doesn't make any sense to try to execute as an isolated command in this context.
   */
  command?: Command;
  disabledHelperText?: string;
}

function convertKeystrokeToKeystrokeInfo(keystroke: string): KeystrokeInfo {
  const normalizedKeystrokeParts = keystroke.split('+').map(part => part.trim());
  return {
    keyCode: parseKeystroke(normalizedKeystrokeParts),
    altKey: normalizedKeystrokeParts.includes('alt'),
    metaKey: normalizedKeystrokeParts.includes('meta'),
    ctrlKey: normalizedKeystrokeParts.includes('ctrl'),
    shiftKey: normalizedKeystrokeParts.includes('shift'),
    // If these aren't wrapped in an object spread, we get a type error because they aren't part
    // of the KeystrokeInfo interface.  However, keystroke callback handlers receive a `cancel` function
    // which it turns out expects keystrokes to have been triggered by a keyboard event that contains
    // these properties.  So we pass them along because we call editor.keystrokes.press manually sometimes.
    ...({
      preventDefault: () => {},
      stopPropagation: () => {},
    })
  };
}

function getDisplayedKeystrokes(keystroke: string): string[] {
  const envKeystroke = getEnvKeystrokeText(keystroke);
  // Non-standard key combinations, like triple-backtick for code blocks (`+`+`),
  // aren't well-handled by ckEditor's keystroke parser, and it returns a string with
  // the value "undefined".  In those cases assume we're dealing with one of our own
  // custom key combinations and split the keystroke string manually.
  if (envKeystroke === 'undefined') {
    return keystroke.split('+');
  }
  return envKeystroke.split('');
}

function isCommandDisabled(commandWithKeystroke: CommandWithKeystroke): boolean {
  return !!commandWithKeystroke.command && !commandWithKeystroke.command.isEnabled;
};

const CommandListItem = ({ commandWithKeystroke, commandIndex: index, selectedIndex, onClose, executeShortcut }: {
  commandWithKeystroke: CommandWithKeystroke;
  commandIndex: number;
  selectedIndex: number;
  onClose: () => void;
  executeShortcut: (commandWithKeystroke: CommandWithKeystroke) => void;
}) => {
  const classes = useStyles(styles);

  const disabled = isCommandDisabled(commandWithKeystroke);
  const selected = index === selectedIndex;
  const hasTooltip = !!commandWithKeystroke.disabledHelperText;
  const menuItemClassName = classNames(
    classes.commandItem,
    selected && 'selected',
    disabled && 'disabled',
  );

  const menuItem = (
    <span
      className={menuItemClassName}
      onClick={() => {
        if (disabled) return;
        onClose();
        setTimeout(() => executeShortcut(commandWithKeystroke), 50);
      }}
    >
      <Typography variant="body2">
        {commandWithKeystroke.label}
      </Typography>
      <div className={classes.keystrokeContainer}>
        {getDisplayedKeystrokes(commandWithKeystroke.keystroke).map((char, idx) =>
          <div key={`${char}-${idx}`} className={classes.keystroke}>
            {char}
          </div>
        )}
      </div>
    </span>
  );

  if (hasTooltip) {
    return (
      <LWTooltip
        key={`${commandWithKeystroke.keystroke}-${commandWithKeystroke.label}`}
        title={commandWithKeystroke.disabledHelperText}
        forceOpen={selected}
        renderWithoutHover={true}
        className={classes.helperTextTooltip}
      >
        {menuItem}
      </LWTooltip>
    );
  }

  return menuItem;
};

const EditorCommandPalette = ({ commands, editor, onClose }: {
  commands: CommandWithKeystroke[];
  editor: Editor;
  onClose: () => void;
}) => {
  const classes = useStyles(styles);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const commandListRef = useRef<HTMLDivElement>(null);

  const filteredCommands = commands.filter(({ label }) => {
    if (!searchQuery) return true;
    return label.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const executeShortcut = (commandWithKeystroke: CommandWithKeystroke) => {
    if (isCommandDisabled(commandWithKeystroke)) {
      return;
    }
    if (commandWithKeystroke.command) {
      commandWithKeystroke.command.execute();
    } else {
      const keystrokeInfo = convertKeystrokeToKeystrokeInfo(commandWithKeystroke.keystroke);
      editor.keystrokes.press(keystrokeInfo);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => prev === filteredCommands.length - 1 ? 0 : prev + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev === 0 ? filteredCommands.length - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          const commandWithKeystroke = filteredCommands[selectedIndex];
          if (isCommandDisabled(commandWithKeystroke)) {
            return;
          }
          onClose();
          setTimeout(() => executeShortcut(commandWithKeystroke), 50);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Focus the search input when the component mounts
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Reset selected index when search query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = commandListRef.current?.children[selectedIndex] as HTMLElement;
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  return (
    <div className={classes.overlay} onClick={handleOverlayClick}>
      <div className={classes.container}>
        <input
          key="command-palette-search-input"
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
            filteredCommands.map((commandWithKeystroke, index) => {
              return <CommandListItem
                key={`${commandWithKeystroke.keystroke}-${commandWithKeystroke.label}`}
                commandWithKeystroke={commandWithKeystroke}
                commandIndex={index}
                selectedIndex={selectedIndex}
                onClose={onClose}
                executeShortcut={executeShortcut}
              />;
            })
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
