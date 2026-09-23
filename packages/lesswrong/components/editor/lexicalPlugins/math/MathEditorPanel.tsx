"use client";

import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { autoUpdate, flip, offset, shift, size, useFloating } from '@floating-ui/react';
import { defineStyles, useStyles } from '../../../hooks/useStyles';
import ForumIcon from '@/components/common/ForumIcon';
import LWTooltip from '@/components/common/LWTooltip';

const styles = defineStyles('MathEditorPanel', (theme: ThemeType) => ({
  panel: {
    zIndex: 1001,
    display: 'flex',
    flexDirection: 'column',
    maxWidth: 'calc(100% - 16px)',
    maxHeight: 'calc(100vh - 16px)',
    overflowY: 'auto',
    backgroundColor: theme.palette.panelBackground.tooltipBackground2,
    borderRadius: '4px',
    boxShadow: `0 10px 20px ${theme.palette.greyAlpha(0.19)}, 0 6px 6px ${theme.palette.greyAlpha(0.23)}`,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px 0',
    color: theme.palette.text.alwaysWhite,
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    lineHeight: '20px',
  },
  helpButton: {
    display: 'flex',
    padding: 0,
    border: 'none',
    background: 'transparent',
    color: 'inherit',
    cursor: 'help',
  },
  helpIcon: {
    width: 16,
    height: 16,
  },
  helpText: {
    whiteSpace: 'pre-line',
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
      color: theme.palette.text.alwaysLightGrey,
    },
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    resize: 'none',
    overflow: 'auto',
    '&:focus': {
      outline: 'none',
    },
    '&::placeholder': {
      color: theme.palette.text.alwaysLightGrey,
    },
  },
}));

function resizeTextareaHeight(textarea: HTMLTextAreaElement) {
  // A scrollbar during measurement can narrow the input and add a spurious line.
  textarea.style.overflowY = 'hidden';
  textarea.style.height = 'auto';
  textarea.style.height = `${Math.max(textarea.scrollHeight, 24)}px`;
  textarea.style.overflowY = '';
}

function constrainPanelWidth({ availableWidth, elements }: {
  availableWidth: number;
  elements: { floating: HTMLElement };
}) {
  const maxWidth = `${Math.max(0, availableWidth)}px`;
  if (elements.floating.style.maxWidth === maxWidth) return;
  elements.floating.style.maxWidth = maxWidth;
  const textarea = elements.floating.querySelector('textarea');
  if (textarea) resizeTextareaHeight(textarea);
}

interface MathEditorPanelProps {
  isOpen: boolean;
  initialEquation?: string;
  isInline: boolean;
  anchor: Element | null;
  editorElement: HTMLElement | null;
  onChange: (equation: string) => void;
  onSubmit: (equation: string) => void;
  onCancel: () => void;
}

function MathEditorPanel({
  isOpen,
  initialEquation = '',
  isInline,
  anchor,
  editorElement,
  onChange,
  onSubmit,
  onCancel,
}: MathEditorPanelProps): React.ReactElement | null {
  const classes = useStyles(styles);
  const [equation, setEquation] = useState(initialEquation);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { refs, floatingStyles, isPositioned, update } = useFloating({
    open: isOpen,
    placement: 'bottom',
    strategy: 'fixed',
    middleware: [
      offset(8),
      flip({ padding: 8 }),
      // Keep vertical placement relative to the viewport, but constrain the
      // horizontal position and width to the editor (and the viewport).
      shift({ boundary: editorElement ?? 'clippingAncestors', padding: 8 }),
      size({ boundary: editorElement ?? 'clippingAncestors', padding: 8, apply: constrainPanelWidth }),
    ],
    whileElementsMounted: autoUpdate,
  });
  const panelRef = refs.floating;
  const { setPositionReference } = refs;

  useLayoutEffect(() => {
    setPositionReference(anchor);
  }, [anchor, setPositionReference]);

  useLayoutEffect(() => {
    if (!isOpen || !editorElement) return;
    const observer = new ResizeObserver(update);
    observer.observe(editorElement);
    return () => observer.disconnect();
  }, [editorElement, isOpen, update]);

  // Reset equation when panel opens or initialEquation changes
  useEffect(() => {
    if (isOpen) {
      setEquation(initialEquation);
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

  // Auto-resize textarea
  useLayoutEffect(() => {
    if (isOpen && inputRef.current) {
      const textarea = inputRef.current;
      // Use the actual monospace character width, plus padding and room for the caret.
      const lines = equation.split('\n');
      const maxLength = Math.max(...lines.map(l => l.length));
      textarea.style.width = `clamp(200px, calc(${maxLength + 1}ch + 24px), 500px)`;
      resizeTextareaHeight(textarea);
    }
  }, [equation, isOpen]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (equation.trim()) {
        onSubmit(equation);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (equation.trim()) {
        onSubmit(equation);
      }
    }
  }, [equation, onSubmit, onCancel]);

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
        onSubmit(equation);
      } else {
        onCancel();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen, equation, onSubmit, onCancel, panelRef]);

  if (!isOpen || !anchor) {
    return null;
  }

  return createPortal(
    <div
      ref={refs.setFloating}
      className={classes.panel}
      style={{ ...floatingStyles, visibility: isPositioned ? 'visible' : 'hidden' }}
    >
      <div className={classes.header}>
        <span>LaTeX</span>
        <LWTooltip
          title={'Type your equation in LaTeX.\nEnter to submit, Esc to cancel, Shift+Enter for newline'}
          titleClassName={classes.helpText}
          placement="top"
        >
          <button type="button" className={classes.helpButton} aria-label="LaTeX help">
            <ForumIcon icon="InfoCircle" className={classes.helpIcon} />
          </button>
        </LWTooltip>
      </div>
      <textarea
        ref={inputRef}
        aria-label={isInline ? "Inline equation" : "Display equation"}
        className={classes.input}
        value={equation}
        onChange={(e) => {
          setEquation(e.target.value);
          onChange(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        placeholder={isInline ? "x^2 + y^2 = z^2" : "\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}"}
        rows={1}
      />
    </div>,
    document.body
  );
}

export default MathEditorPanel;
