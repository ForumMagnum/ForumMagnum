"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../../../hooks/useStyles';

const MAX_ROWS = 10;
const MAX_COLS = 10;

const styles = defineStyles('TableDimensionSelector', (theme: ThemeType) => ({
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  panel: {
    position: 'fixed',
    zIndex: 1001,
    backgroundColor: theme.palette.panelBackground.default,
    borderRadius: 4,
    boxShadow: `0 4px 12px ${theme.palette.boxShadowColor(0.2)}`,
    border: theme.palette.greyBorder('1px', 0.2),
    padding: 12,
  },
  grid: {
    display: 'grid',
    gap: 2,
    cursor: 'pointer',
  },
  cell: {
    width: 18,
    height: 18,
    border: theme.palette.greyBorder('1px', 0.3),
    borderRadius: 2,
    backgroundColor: theme.palette.panelBackground.default,
    transition: 'background-color 0.1s ease, border-color 0.1s ease',
  },
  cellHighlighted: {
    backgroundColor: theme.palette.primary.light,
    borderColor: theme.palette.primary.main,
  },
  dimensionLabel: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 12,
    color: theme.palette.text.dim,
    fontWeight: 500,
  },
}));

interface TableDimensionSelectorProps {
  isOpen: boolean;
  anchorRect: DOMRect | null;
  onSelect: (rows: number, cols: number) => void;
  onCancel: () => void;
}

function TableDimensionSelector({
  isOpen,
  anchorRect,
  onSelect,
  onCancel,
}: TableDimensionSelectorProps): React.ReactElement | null {
  const classes = useStyles(styles);
  const [hoveredRow, setHoveredRow] = useState(0);
  const [hoveredCol, setHoveredCol] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // Reset hover state when panel opens
  useEffect(() => {
    if (isOpen) {
      setHoveredRow(0);
      setHoveredCol(0);
    }
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;
    
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    }
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  const handleMouseEnter = useCallback((row: number, col: number) => {
    setHoveredRow(row);
    setHoveredCol(col);
  }, []);

  const handleClick = useCallback((row: number, col: number) => {
    onSelect(row + 1, col + 1);
  }, [onSelect]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  }, [onCancel]);

  if (!isOpen || !anchorRect) {
    return null;
  }

  // Calculate position - below the button
  const panelStyle: React.CSSProperties = {
    left: anchorRect.left,
    top: anchorRect.bottom + 4,
  };

  // Adjust if panel would go off-screen
  if (typeof window !== 'undefined') {
    const panelWidth = (MAX_COLS * 20) + 24;
    const panelHeight = (MAX_ROWS * 20) + 44;
    
    if (anchorRect.left + panelWidth > window.innerWidth) {
      panelStyle.left = window.innerWidth - panelWidth - 8;
    }
    if (anchorRect.bottom + panelHeight > window.innerHeight) {
      // Position above instead
      panelStyle.top = anchorRect.top - panelHeight - 4;
    }
  }

  // Create the grid cells
  const cells: React.ReactElement[] = [];
  for (let row = 0; row < MAX_ROWS; row++) {
    for (let col = 0; col < MAX_COLS; col++) {
      const isHighlighted = row <= hoveredRow && col <= hoveredCol;
      cells.push(
        <div
          key={`${row}-${col}`}
          className={classNames(classes.cell, {
            [classes.cellHighlighted]: isHighlighted,
          })}
          onMouseEnter={() => handleMouseEnter(row, col)}
          onClick={() => handleClick(row, col)}
        />
      );
    }
  }

  const dimensionText = hoveredRow >= 0 && hoveredCol >= 0
    ? `${hoveredRow + 1} × ${hoveredCol + 1}`
    : 'Select size';

  return createPortal(
    <div className={classes.overlay} onClick={handleOverlayClick}>
      <div
        ref={panelRef}
        className={classes.panel}
        style={panelStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className={classes.grid}
          style={{ gridTemplateColumns: `repeat(${MAX_COLS}, 18px)` }}
          onMouseLeave={() => {
            setHoveredRow(-1);
            setHoveredCol(-1);
          }}
        >
          {cells}
        </div>
        <div className={classes.dimensionLabel}>
          {dimensionText}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default TableDimensionSelector;
