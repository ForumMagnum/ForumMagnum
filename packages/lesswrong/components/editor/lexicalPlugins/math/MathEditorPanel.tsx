"use client";

import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { autoUpdate, flip, offset, shift, useFloating, type VirtualElement } from '@floating-ui/react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../../../hooks/useStyles';
import { renderEquation } from './loadMathJax';

const styles = defineStyles('MathEditorPanel', (theme: ThemeType) => ({
  panel: {
    zIndex: 1001,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    maxWidth: 'calc(100% - 16px)',
    maxHeight: 'calc(100vh - 16px)',
    overflowY: 'auto',
  },
  inputContainer: {
    maxWidth: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  input: {
    minWidth: 0,
    maxWidth: '100%',
    maxHeight: '50vh',
    boxSizing: 'border-box',
    padding: '8px 12px',
    fontFamily: 'monospace',
    fontSize: '14px',
    '&&': {
      color: theme.palette.grey[100],
    },
    backgroundColor: theme.palette.grey[800],
    border: 'none',
    borderRadius: '4px',
    outline: 'none',
    boxShadow: `0 10px 20px ${theme.palette.greyAlpha(0.19)}, 0 6px 6px ${theme.palette.greyAlpha(0.23)}`,
    resize: 'none',
    overflow: 'auto',
    '&:focus': {
      outline: 'none',
    },
    '&::placeholder': {
      color: theme.palette.inverseGreyAlpha(0.5),
    },
  },
  preview: {
    padding: '8px 16px',
    backgroundColor: theme.palette.panelBackground.default,
    borderRadius: '8px',
    boxShadow: `0 10px 20px ${theme.palette.greyAlpha(0.19)}, 0 6px 6px ${theme.palette.greyAlpha(0.23)}`,
    border: `1px solid ${theme.palette.grey[300]}`,
    minWidth: '50px',
    maxWidth: '100%',
    overflowX: 'auto',
    flexShrink: 0,
    minHeight: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    '& mjx-merror': {
      fontSize: '14px',
      color: theme.palette.error.light,
      backgroundColor: 'transparent',
    },
  },
  hiddenPreview: {
    display: 'none',
  },
  hint: {
    textAlign: 'center',
    fontSize: '11px',
    color: theme.palette.grey[600],
    marginTop: '4px',
  },
}));

interface MathEditorPanelProps {
  isOpen: boolean;
  initialEquation?: string;
  isInline: boolean;
  anchor: VirtualElement | null;
  onSubmit: (equation: string, inline: boolean) => void;
  onCancel: () => void;
}

function MathEditorPanel({
  isOpen,
  initialEquation = '',
  isInline,
  anchor,
  onSubmit,
  onCancel,
}: MathEditorPanelProps): React.ReactElement | null {
  const classes = useStyles(styles);
  const [equation, setEquation] = useState(initialEquation);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const { refs, floatingStyles, isPositioned } = useFloating({
    open: isOpen,
    placement: 'bottom',
    strategy: 'fixed',
    middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });
  const panelRef = refs.floating;
  const { setPositionReference } = refs;

  useLayoutEffect(() => {
    setPositionReference(anchor);
  }, [anchor, setPositionReference]);

  // Reset equation when panel opens or initialEquation changes
  useEffect(() => {
    if (isOpen) {
      setEquation(initialEquation);
      
      // Also immediately render the preview with the initial equation
      // (don't wait for the state update to propagate)
      if (previewRef.current && initialEquation.trim()) {
        previewRef.current.textContent = '...';
        void renderEquation(initialEquation, previewRef.current, !isInline);
      }
    }
  }, [isOpen, initialEquation, isInline]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && isPositioned && inputRef.current) {
      const timeoutId = window.setTimeout(() => {
        inputRef.current?.focus({ preventScroll: true });
        inputRef.current?.select();
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }
  }, [isOpen, isPositioned]);

  // Render preview with MathJax
  // Note: we include `isOpen` to force re-render when panel opens with initial equation
  useEffect(() => {
    if (!isOpen || !previewRef.current) return;

    if (!equation.trim()) {
      previewRef.current.textContent = '';
      return;
    }

    // Show loading indicator
    previewRef.current.textContent = '...';
    
    // Render the equation (this will load MathJax if needed)
    void renderEquation(equation, previewRef.current, !isInline);
  }, [equation, isInline, isOpen]);

  // Auto-resize textarea
  useLayoutEffect(() => {
    if (isOpen && inputRef.current) {
      const textarea = inputRef.current;
      // Also adjust width based on content
      const lines = equation.split('\n');
      const maxLength = Math.max(...lines.map(l => l.length), 20);
      textarea.style.width = `${Math.max(200, Math.min((maxLength * 8) + 24, 500))}px`;
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(textarea.scrollHeight, 24)}px`;
    }
  }, [equation, isOpen]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (equation.trim()) {
        onSubmit(equation, isInline);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (equation.trim()) {
        onSubmit(equation, isInline);
      }
    }
  }, [equation, isInline, onSubmit, onCancel]);

  // Submit (or cancel, if empty) when the user starts a pointer interaction
  // outside the panel. Listening for pointerdown (rather than click) means a
  // drag that starts inside the panel can never dismiss it, even if the
  // pointer is released outside.
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panelRef.current?.contains(target)) return;
      // Scrollbar interactions target the root element; ignore them so
      // scrolling the page doesn't dismiss the panel.
      if (target === document.documentElement) return;
      if (equation.trim()) {
        onSubmit(equation, isInline);
      } else {
        onCancel();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen, equation, isInline, onSubmit, onCancel, panelRef]);

  if (!isOpen || !anchor) {
    return null;
  }

  return createPortal(
    <div
      ref={refs.setFloating}
      className={classes.panel}
      style={{ ...floatingStyles, visibility: isPositioned ? 'visible' : 'hidden' }}
    >
      <div className={classes.inputContainer}>
        <textarea
          ref={inputRef}
          aria-label={isInline ? "Inline equation" : "Display equation"}
          className={classes.input}
          value={equation}
          onChange={(e) => setEquation(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isInline ? "x^2 + y^2 = z^2" : "\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}"}
          rows={1}
        />
        <div className={classes.hint}>
          Enter to submit • Esc to cancel • Shift+Enter for newline
        </div>
      </div>
      <div
        ref={previewRef}
        className={classNames(classes.preview, { [classes.hiddenPreview]: !equation.trim() })}
      />
    </div>,
    document.body
  );
}

export default MathEditorPanel;
