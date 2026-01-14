"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { defineStyles, useStyles } from '../../../hooks/useStyles';
import { renderEquation } from './loadMathJax';

const styles = defineStyles('MathEditorPanel', (theme: ThemeType) => ({
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
    color: '#fff',
    backgroundColor: '#4F4F4F',
    border: 'none',
    borderRadius: '4px',
    outline: 'none',
    boxShadow: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
    resize: 'none',
    overflow: 'hidden',
    '&:focus': {
      outline: 'none',
    },
    '&::placeholder': {
      color: 'rgba(255,255,255,0.5)',
    },
  },
  preview: {
    padding: '8px 16px',
    backgroundColor: theme.palette.panelBackground.default,
    borderRadius: '8px',
    boxShadow: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
    border: `1px solid ${theme.palette.grey[300]}`,
    minWidth: '50px',
    minHeight: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '& mjx-merror': {
      fontSize: '14px',
      color: '#e64a19',
      backgroundColor: 'transparent',
    },
  },
  hint: {
    fontSize: '11px',
    color: theme.palette.grey[600],
    marginTop: '4px',
  },
}), { allowNonThemeColors: true });

interface MathEditorPanelProps {
  isOpen: boolean;
  initialEquation?: string;
  isInline: boolean;
  anchorRect: DOMRect | null;
  onSubmit: (equation: string, inline: boolean) => void;
  onCancel: () => void;
}

function MathEditorPanel({
  isOpen,
  initialEquation = '',
  isInline,
  anchorRect,
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
  useEffect(() => {
    if (inputRef.current) {
      const textarea = inputRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(textarea.scrollHeight, 24)}px`;
      
      // Also adjust width based on content
      const lines = equation.split('\n');
      const maxLength = Math.max(...lines.map(l => l.length), 20);
      textarea.style.width = `${Math.min((maxLength * 8) + 24, 500)}px`;
    }
  }, [equation]);

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

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    // Only close if clicking the overlay itself, not the panel
    if (e.target === e.currentTarget) {
      if (equation.trim()) {
        onSubmit(equation, isInline);
      } else {
        onCancel();
      }
    }
  }, [equation, isInline, onSubmit, onCancel]);

  if (!isOpen || !anchorRect) {
    return null;
  }

  // Calculate position - center below the cursor
  const panelStyle: React.CSSProperties = {
    left: anchorRect.left + (anchorRect.width / 2),
    top: anchorRect.bottom + 8,
    transform: 'translateX(-50%)',
  };

  return createPortal(
    <div className={classes.overlay} onClick={handleOverlayClick}>
      <div
        ref={panelRef}
        className={classes.panel}
        style={panelStyle}
        onClick={(e) => e.stopPropagation()}
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
      </div>
    </div>,
    document.body
  );
}

export default MathEditorPanel;

