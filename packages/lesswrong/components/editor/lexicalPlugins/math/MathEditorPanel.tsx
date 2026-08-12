"use client";

import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { defineStyles, useStyles } from '../../../hooks/useStyles';
import { renderEquation } from './loadMathJax';

const styles = defineStyles('MathEditorPanel', (theme: ThemeType) => ({
  panel: {
    position: 'absolute',
    zIndex: 1001,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  inputContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  input: {
    minWidth: '200px',
    maxWidth: '500px',
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
    overflow: 'hidden',
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
    minHeight: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '& mjx-merror': {
      fontSize: '14px',
      color: theme.palette.error.light,
      backgroundColor: 'transparent',
    },
  },
  hint: {
    fontSize: '11px',
    color: theme.palette.grey[600],
    marginTop: '4px',
  },
}));

/**
 * Position the panel is anchored to, in document (not viewport) coordinates,
 * so that the panel scrolls together with the document.
 */
export interface MathEditorAnchor {
  left: number;
  bottom: number;
  width: number;
}

interface MathEditorPanelProps {
  isOpen: boolean;
  initialEquation?: string;
  isInline: boolean;
  anchor: MathEditorAnchor | null;
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
  const panelRef = useRef<HTMLDivElement>(null);

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
    if (isOpen && inputRef.current) {
      const timeoutId = window.setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }
  }, [isOpen]);

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
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(textarea.scrollHeight, 24)}px`;
      
      // Also adjust width based on content
      const lines = equation.split('\n');
      const maxLength = Math.max(...lines.map(l => l.length), 20);
      textarea.style.width = `${Math.min((maxLength * 8) + 24, 500)}px`;
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
  }, [isOpen, equation, isInline, onSubmit, onCancel]);

  if (!isOpen || !anchor) {
    return null;
  }

  // Calculate position - center below the cursor
  const panelStyle: React.CSSProperties = {
    left: anchor.left + (anchor.width / 2),
    top: anchor.bottom + 8,
    transform: 'translateX(-50%)',
  };

  return createPortal(
    <div
      ref={panelRef}
      className={classes.panel}
      style={panelStyle}
    >
      <div className={classes.inputContainer}>
        <textarea
          ref={inputRef}
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
        className={classes.preview}
        style={{ display: equation.trim() ? 'flex' : 'none' }}
      />
    </div>,
    document.body
  );
}

export default MathEditorPanel;

