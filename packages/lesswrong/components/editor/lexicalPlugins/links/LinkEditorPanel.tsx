"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../../../hooks/useStyles';

const styles = defineStyles('LinkEditorPanel', (theme: ThemeType) => ({
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  panel: {
    position: 'absolute',
    zIndex: 1001,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.palette.panelBackground.default,
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.1)',
    border: `1px solid ${theme.palette.grey[300]}`,
    overflow: 'hidden',
    minWidth: '300px',
  },
  // Toolbar mode (shown when clicking on existing link)
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    gap: '8px',
  },
  linkPreview: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: theme.palette.primary.main,
    fontSize: '14px',
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  toolbarButton: {
    padding: '6px 10px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    borderRadius: '4px',
    fontSize: '13px',
    color: theme.palette.text.normal,
    '&:hover': {
      backgroundColor: theme.palette.greyAlpha(0.1),
    },
  },
  toolbarButtonDanger: {
    color: theme.palette.error.main,
    '&:hover': {
      backgroundColor: theme.palette.error.light,
      color: theme.palette.error.dark,
    },
  },
  // Form mode (shown when editing/creating)
  form: {
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 500,
    color: theme.palette.grey[600],
  },
  input: {
    padding: '8px 10px',
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: '4px',
    fontSize: '14px',
    outline: 'none',
    '&:focus': {
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 2px ${theme.palette.primary.light}`,
    },
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '4px',
  },
  button: {
    padding: '6px 14px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    color: theme.palette.grey[600],
    '&:hover': {
      backgroundColor: theme.palette.greyAlpha(0.1),
    },
  },
  saveButton: {
    backgroundColor: theme.palette.primary.main,
    color: '#fff',
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
    '&:disabled': {
      backgroundColor: theme.palette.grey[300],
      cursor: 'not-allowed',
    },
  },
  hint: {
    fontSize: '11px',
    color: theme.palette.grey[500],
    marginTop: '2px',
  },
}), { allowNonThemeColors: true });

export type LinkEditorMode = 'toolbar' | 'form';

interface LinkEditorPanelProps {
  isOpen: boolean;
  mode: LinkEditorMode;
  initialUrl: string;
  initialText: string;
  anchorRect: DOMRect | null;
  onSave: (url: string, text?: string) => void;
  onUnlink: () => void;
  onOpenLink: (url: string) => void;
  onEditClick: () => void;
  onCancel: () => void;
}

function LinkEditorPanel({
  isOpen,
  mode,
  initialUrl,
  initialText,
  anchorRect,
  onSave,
  onUnlink,
  onOpenLink,
  onEditClick,
  onCancel,
}: LinkEditorPanelProps): React.ReactElement | null {
  const classes = useStyles(styles);
  const [url, setUrl] = useState(initialUrl);
  const [text, setText] = useState(initialText);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Reset form when panel opens
  useEffect(() => {
    if (isOpen) {
      setUrl(initialUrl);
      setText(initialText);
    }
  }, [isOpen, initialUrl, initialText]);

  // Focus URL input when in form mode
  useEffect(() => {
    if (isOpen && mode === 'form' && urlInputRef.current) {
      urlInputRef.current.focus();
      urlInputRef.current.select();
    }
  }, [isOpen, mode]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (url.trim()) {
        onSave(url, text || undefined);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  }, [url, text, onSave, onCancel]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  }, [onCancel]);

  const handleSave = useCallback(() => {
    if (url.trim()) {
      onSave(url, text || undefined);
    }
  }, [url, text, onSave]);

  if (!isOpen || !anchorRect) {
    return null;
  }

  // Calculate position - below the selection
  const panelStyle: React.CSSProperties = {
    left: anchorRect.left,
    top: anchorRect.bottom + 8,
  };

  // Adjust if panel would go off-screen
  if (typeof window !== 'undefined') {
    const maxLeft = window.innerWidth - 320;
    if (anchorRect.left > maxLeft) {
      panelStyle.left = maxLeft;
    }
  }

  return createPortal(
    <div className={classes.overlay} onClick={handleOverlayClick}>
      <div
        ref={panelRef}
        className={classes.panel}
        style={panelStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {mode === 'toolbar' ? (
          <div className={classes.toolbar}>
            <a
              href={initialUrl}
              className={classes.linkPreview}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                onOpenLink(initialUrl);
              }}
              title={initialUrl}
            >
              {initialUrl}
            </a>
            <button
              type="button"
              className={classes.toolbarButton}
              onClick={onEditClick}
              title="Edit link"
            >
              Edit
            </button>
            <button
              type="button"
              className={classNames(classes.toolbarButton, classes.toolbarButtonDanger)}
              onClick={onUnlink}
              title="Remove link"
            >
              Unlink
            </button>
          </div>
        ) : (
          <div className={classes.form}>
            <div className={classes.inputGroup}>
              <label className={classes.label}>URL</label>
              <input
                ref={urlInputRef}
                type="text"
                className={classes.input}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="https://example.com"
              />
            </div>
            {initialText && (
              <div className={classes.inputGroup}>
                <label className={classes.label}>Text</label>
                <input
                  type="text"
                  className={classes.input}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Link text"
                />
              </div>
            )}
            <div className={classes.hint}>
              Press Enter to save • Esc to cancel
            </div>
            <div className={classes.buttonRow}>
              <button
                type="button"
                className={classNames(classes.button, classes.cancelButton)}
                onClick={onCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className={classNames(classes.button, classes.saveButton)}
                onClick={handleSave}
                disabled={!url.trim()}
              >
                {initialUrl ? 'Update' : 'Insert'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default LinkEditorPanel;

