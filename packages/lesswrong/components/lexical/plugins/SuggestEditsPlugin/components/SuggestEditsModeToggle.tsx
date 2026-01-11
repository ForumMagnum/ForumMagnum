"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import {
  getSuggestingMode,
  subscribeModeChange,
} from '../SuggestEditsPlugin';
import {
  getSuggestEditsConfig,
  isSuggestEditsEnabled,
  subscribeEnabledChange,
} from '../SuggestEditsExtension';
import { SET_SUGGESTING_MODE_COMMAND } from '../commands';

const styles = defineStyles('SuggestEditsModeToggle', (theme: ThemeType) => ({
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginLeft: '8px',
    borderLeft: theme.palette.greyBorder('1px', 0.2),
    paddingLeft: '8px',
    minWidth: 250,
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px 8px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    transition: 'background-color 0.15s ease, color 0.15s ease',
    backgroundColor: 'transparent',
    color: theme.palette.grey[600],
    '&:hover:not(:disabled)': {
      backgroundColor: theme.palette.greyAlpha(0.1),
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
  activeButton: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '&:hover:not(:disabled)': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
  label: {
    fontSize: '12px',
    color: theme.palette.grey[600],
    marginRight: '4px',
  },
  editingIcon: {
    width: '14px',
    height: '14px',
    marginRight: '4px',
  },
  suggestingIcon: {
    width: '14px',
    height: '14px',
    marginRight: '4px',
  },
}));

interface SuggestEditsModeToggleProps {
  disabled?: boolean;
}

export function SuggestEditsModeToggle({ disabled = false }: SuggestEditsModeToggleProps) {
  const classes = useStyles(styles);
  const [editor] = useLexicalComposerContext();
  const [isEnabled, setIsEnabled] = useState(isSuggestEditsEnabled);
  const [mode, setMode] = useState<'editing' | 'suggesting'>(getSuggestingMode);
  const config = getSuggestEditsConfig();

  useEffect(() => {
    // Subscribe to enabled changes
    return subscribeEnabledChange((enabled) => {
      setIsEnabled(enabled);
    });
  }, []);

  useEffect(() => {
    // Subscribe to mode changes from the extension
    return subscribeModeChange((newMode) => {
      setMode(newMode);
    });
  }, []);

  const handleModeChange = useCallback((newMode: 'editing' | 'suggesting') => {
    editor.dispatchCommand(SET_SUGGESTING_MODE_COMMAND, newMode === 'suggesting');
  }, [editor]);

  // Don't show the toggle if the extension is not enabled
  if (!isEnabled) {
    return null;
  }

  // If user can't edit or suggest, don't show the toggle
  if (!config.canEdit && !config.canSuggest) {
    return null;
  }

  // If user can only suggest (not edit), always show suggesting mode
  const canToggle = config.canEdit && config.canSuggest;

  return (
    <div className={classes.container}>
      <span className={classes.label}>Mode:</span>
      <button
        type="button"
        className={classNames(classes.button, mode === 'editing' && classes.activeButton)}
        onClick={() => handleModeChange('editing')}
        disabled={disabled || !config.canEdit}
        title="Direct editing mode - changes are applied immediately"
        aria-pressed={mode === 'editing'}
      >
        <EditIcon className={classes.editingIcon} />
        Editing
      </button>
      <button
        type="button"
        className={classNames(classes.button, mode === 'suggesting' && classes.activeButton)}
        onClick={() => handleModeChange('suggesting')}
        disabled={disabled || !canToggle}
        title="Suggesting mode - changes are proposed as suggestions"
        aria-pressed={mode === 'suggesting'}
      >
        <SuggestIcon className={classes.suggestingIcon} />
        Suggesting
      </button>
    </div>
  );
}

// Simple edit icon (pencil)
function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
  );
}

// Suggestion icon (lightbulb or similar)
function SuggestIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z" />
    </svg>
  );
}

export default SuggestEditsModeToggle;
