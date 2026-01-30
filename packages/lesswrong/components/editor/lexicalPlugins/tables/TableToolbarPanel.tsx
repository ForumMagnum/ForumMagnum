"use client";

import React, { useCallback, useState, useRef, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../../../hooks/useStyles';
import ToggleSwitch from '../../../common/ToggleSwitch';

const styles = defineStyles('TableToolbarPanel', (theme: ThemeType) => ({
  toolbar: {
    position: 'fixed',
    zIndex: 1001,
    display: 'flex',
    alignItems: 'center',
    backgroundColor: theme.palette.panelBackground.default,
    borderRadius: 4,
    boxShadow: `0 2px 8px ${theme.palette.boxShadowColor(0.15)}`,
    border: theme.palette.greyBorder('1px', 0.2),
    padding: 4,
    gap: 2,
  },
  toolbarButton: {
    padding: '6px 8px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    borderRadius: 3,
    fontSize: 14,
    color: theme.palette.text.normal,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 28,
    height: 28,
    '&:hover': {
      backgroundColor: theme.palette.greyAlpha(0.1),
    },
    '&:disabled': {
      opacity: 0.4,
      cursor: 'not-allowed',
    },
  },
  toolbarButtonActive: {
    backgroundColor: theme.palette.greyAlpha(0.15),
  },
  toolbarButtonWithDropdown: {
    gap: 2,
    paddingRight: 4,
  },
  splitButton: {
    display: 'flex',
    alignItems: 'center',
    borderRadius: 3,
    // Shared hover effect for the whole button group
    '&:hover': {
      backgroundColor: theme.palette.greyAlpha(0.08),
    },
    '&:hover $splitButtonDivider': {
      opacity: 1,
    },
  },
  splitButtonMain: {
    padding: '6px 8px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    fontSize: 14,
    color: theme.palette.text.normal,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
    '&:hover': {
      backgroundColor: theme.palette.greyAlpha(0.08),
    },
    '&:disabled': {
      opacity: 0.4,
      cursor: 'not-allowed',
      '&:hover': {
        backgroundColor: 'transparent',
      },
    },
  },
  splitButtonDivider: {
    width: 1,
    height: 16,
    backgroundColor: theme.palette.greyAlpha(0.3),
    opacity: 0,
    transition: 'opacity 0.15s ease',
  },
  splitButtonDropdown: {
    padding: '6px 4px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    fontSize: 8,
    color: theme.palette.text.normal,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
    '&:hover': {
      backgroundColor: theme.palette.greyAlpha(0.08),
    },
  },
  splitButtonDropdownActive: {
    backgroundColor: theme.palette.greyAlpha(0.15),
  },
  dropdownArrow: {
    fontSize: 8,
    marginLeft: 2,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: theme.palette.greyAlpha(0.2),
    margin: '0 4px',
  },
  dropdown: {
    position: 'fixed',
    zIndex: 1002,
    backgroundColor: theme.palette.panelBackground.default,
    borderRadius: 4,
    boxShadow: `0 4px 12px ${theme.palette.boxShadowColor(0.2)}`,
    border: theme.palette.greyBorder('1px', 0.2),
    padding: 4,
    minWidth: 160,
  },
  dropdownItem: {
    padding: '8px 12px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    borderRadius: 3,
    fontSize: 13,
    color: theme.palette.text.normal,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    textAlign: 'left',
    '&:hover': {
      backgroundColor: theme.palette.greyAlpha(0.1),
    },
    '&:disabled': {
      opacity: 0.4,
      cursor: 'not-allowed',
      '&:hover': {
        backgroundColor: 'transparent',
      },
    },
  },
  dropdownItemDanger: {
    color: theme.palette.error.main,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: theme.palette.greyAlpha(0.15),
    margin: '4px 0',
  },
  icon: {
    width: 16,
    textAlign: 'center',
    flexShrink: 0,
  },
  tableIcon: {
    width: 16,
    height: 16,
    display: 'block',
  },
  dropdownItemText: {
    flex: 1,
  },
  dropdownToggle: {
    marginLeft: 'auto',
  },
}));

type TableIconHighlight = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function TableGridIcon({
  className,
  highlightRect,
  maskRect,
}: {
  className?: string;
  highlightRect?: TableIconHighlight;
  maskRect?: TableIconHighlight;
}): React.ReactElement {
  const maskId = useId();
  const baseStrokeOpacity = 0.6;

  return (
    <svg className={className} viewBox="0 0 18 18" aria-hidden="true">
      {maskRect ? (
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <rect x="0" y="0" width="18" height="18" fill="white" />
          <rect
            x={maskRect.x}
            y={maskRect.y}
            width={maskRect.width}
            height={maskRect.height}
            fill="black"
            rx="1"
            ry="1"
          />
        </mask>
      ) : null}
      <g mask={maskRect ? `url(#${maskId})` : undefined}>
        <rect
          x="1"
          y="1"
          width="16"
          height="16"
          rx="1"
          ry="1"
          stroke="currentColor"
          fill="none"
          strokeWidth="1"
          strokeOpacity={baseStrokeOpacity}
        />
        <line x1="6" y1="1" x2="6" y2="17" stroke="currentColor" strokeWidth="1" strokeOpacity={baseStrokeOpacity} />
        <line x1="12" y1="1" x2="12" y2="17" stroke="currentColor" strokeWidth="1" strokeOpacity={baseStrokeOpacity} />
        <line x1="1" y1="6" x2="17" y2="6" stroke="currentColor" strokeWidth="1" strokeOpacity={baseStrokeOpacity} />
        <line x1="1" y1="12" x2="17" y2="12" stroke="currentColor" strokeWidth="1" strokeOpacity={baseStrokeOpacity} />
      </g>
      {highlightRect ? (
        <rect
          x={highlightRect.x}
          y={highlightRect.y}
          width={highlightRect.width}
          height={highlightRect.height}
          stroke="currentColor"
          fill="none"
          strokeWidth="2"
          rx="1"
          ry="1"
        />
      ) : null}
    </svg>
  );
}

function ColumnIcon({ className }: { className?: string }): React.ReactElement {
  return <TableGridIcon className={className} highlightRect={{ x: 6, y: 1, width: 6, height: 16 }} />;
}

function RowIcon({ className }: { className?: string }): React.ReactElement {
  return <TableGridIcon className={className} highlightRect={{ x: 1, y: 6, width: 16, height: 6 }} />;
}

function MergeIcon({ className }: { className?: string }): React.ReactElement {
  const mergeRect = { x: 6, y: 6, width: 11, height: 11 };
  return <TableGridIcon className={className} highlightRect={mergeRect} maskRect={mergeRect} />;
}

export interface MergeCellCapabilities {
  canMergeUp: boolean;
  canMergeRight: boolean;
  canMergeDown: boolean;
  canMergeLeft: boolean;
  canSplitVertically: boolean;
  canSplitHorizontally: boolean;
}

export interface TableToolbarActions {
  // Column operations
  insertColumnLeft: () => void;
  insertColumnRight: () => void;
  deleteColumn: () => void;
  // Row operations
  insertRowAbove: () => void;
  insertRowBelow: () => void;
  deleteRow: () => void;
  // Merge/split operations
  mergeSelectedCells: () => void;
  mergeCellUp: () => void;
  mergeCellRight: () => void;
  mergeCellDown: () => void;
  mergeCellLeft: () => void;
  splitCellVertically: () => void;
  splitCellHorizontally: () => void;
  // Table operations
  toggleHeaderRow: () => void;
  toggleHeaderColumn: () => void;
  deleteTable: () => void;
}

interface TableToolbarPanelProps {
  isOpen: boolean;
  tableElement: HTMLTableElement | null;
  actions: TableToolbarActions;
  onClose: () => void;
  mergeCapabilities: MergeCellCapabilities;
  hasMultipleCellsSelected: boolean;
  hasHeaderRow: boolean;
  hasHeaderColumn: boolean;
}

type DropdownType = 'column' | 'row' | 'merge' | null;

interface ToolbarPosition {
  left: number;
  top: number;
  positionBelow: boolean;
}

function calculateToolbarPosition(tableElement: HTMLTableElement): ToolbarPosition {
  const rect = tableElement.getBoundingClientRect();
  const positionBelow = rect.top < 60;
  
  return {
    left: rect.left + (rect.width / 2),
    top: positionBelow ? rect.bottom + 8 : rect.top - 8,
    positionBelow,
  };
}

function TableToolbarPanel({
  isOpen,
  tableElement,
  actions,
  onClose,
  mergeCapabilities,
  hasMultipleCellsSelected,
  hasHeaderRow,
  hasHeaderColumn,
}: TableToolbarPanelProps): React.ReactElement | null {
  const classes = useStyles(styles);
  const [activeDropdown, setActiveDropdown] = useState<DropdownType>(null);
  const [position, setPosition] = useState<ToolbarPosition | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mergeButtonRef = useRef<HTMLDivElement>(null);

  // Update position when tableElement changes or on scroll
  useEffect(() => {
    if (!isOpen || !tableElement) {
      setPosition(null);
      return;
    }

    function updatePosition() {
      if (tableElement) {
        setPosition(calculateToolbarPosition(tableElement));
      }
    }

    // Initial position
    updatePosition();

    // Update on scroll (capture phase to get all scroll events)
    function handleScroll() {
      updatePosition();
      // Close dropdown when scrolling
      setActiveDropdown(null);
    }

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', updatePosition);
    
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, tableElement]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!activeDropdown) return;
    
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        toolbarRef.current && !toolbarRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setActiveDropdown(null);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  // Close dropdown and toolbar on escape
  useEffect(() => {
    if (!isOpen) return;
    
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (activeDropdown) {
          setActiveDropdown(null);
        } else {
          onClose();
        }
      }
    }
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeDropdown, onClose]);

  const toggleDropdown = useCallback((dropdown: DropdownType) => {
    setActiveDropdown(prev => prev === dropdown ? null : dropdown);
  }, []);

  const handleAction = useCallback((action: () => void) => {
    action();
    setActiveDropdown(null);
  }, []);

  const handleMergeMainClick = useCallback(() => {
    if (hasMultipleCellsSelected) {
      actions.mergeSelectedCells();
    } else {
      toggleDropdown('merge');
    }
  }, [hasMultipleCellsSelected, actions, toggleDropdown]);

  if (!isOpen || !tableElement || !position) {
    return null;
  }

  // Position toolbar above or below the table, centered horizontally
  const toolbarStyle: React.CSSProperties = {
    left: position.left,
    top: position.top,
    transform: position.positionBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
  };

  // Get button positions for dropdown anchoring
  function getButtonRect(buttonIndex: number): DOMRect | null {
    if (!toolbarRef.current) return null;
    const buttons = toolbarRef.current.querySelectorAll('button');
    const button = buttons[buttonIndex];
    return button?.getBoundingClientRect() ?? null;
  }

  function getMergeButtonRect(): DOMRect | null {
    return mergeButtonRef.current?.getBoundingClientRect() ?? null;
  }

  function renderDropdown() {
    if (!activeDropdown) return null;
    
    let buttonRect: DOMRect | null = null;
    
    if (activeDropdown === 'merge') {
      buttonRect = getMergeButtonRect();
    } else {
      // Map dropdown type to button index
      const buttonIndexMap: Record<'column' | 'row', number> = {
        column: 0,
        row: 1,
      };
      buttonRect = getButtonRect(buttonIndexMap[activeDropdown]);
    }
    
    if (!buttonRect) return null;
    
    const dropdownStyle: React.CSSProperties = {
      left: buttonRect.left,
      top: buttonRect.bottom + 4,
    };
    
    // Adjust if dropdown would go off-screen
    if (typeof window !== 'undefined') {
      const maxLeft = window.innerWidth - 180;
      if (buttonRect.left > maxLeft) {
        dropdownStyle.left = maxLeft;
      }
    }
    
    return createPortal(
      <div ref={dropdownRef} className={classes.dropdown} style={dropdownStyle}>
        {activeDropdown === 'column' && (
          <>
            <button
              type="button"
              className={classes.dropdownItem}
              onClick={() => actions.toggleHeaderColumn()}
            >
              <span className={classes.dropdownItemText}>Header column</span>
              <span
                className={classes.dropdownToggle}
                onClick={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
              >
                <ToggleSwitch
                  value={hasHeaderColumn}
                  setValue={() => actions.toggleHeaderColumn()}
                  smallVersion
                />
              </span>
            </button>
            <div className={classes.dropdownDivider} />
            <button
              type="button"
              className={classes.dropdownItem}
              onClick={() => handleAction(actions.insertColumnLeft)}
            >
              <span className={classes.icon}>←</span>
              <span className={classes.dropdownItemText}>Insert column left</span>
            </button>
            <button
              type="button"
              className={classes.dropdownItem}
              onClick={() => handleAction(actions.insertColumnRight)}
            >
              <span className={classes.icon}>→</span>
              <span className={classes.dropdownItemText}>Insert column right</span>
            </button>
            <button
              type="button"
              className={classNames(classes.dropdownItem, classes.dropdownItemDanger)}
              onClick={() => handleAction(actions.deleteColumn)}
            >
              <span className={classes.icon}>×</span>
              <span className={classes.dropdownItemText}>Delete column</span>
            </button>
          </>
        )}
        {activeDropdown === 'row' && (
          <>
            <button
              type="button"
              className={classes.dropdownItem}
              onClick={() => actions.toggleHeaderRow()}
            >
              <span className={classes.dropdownItemText}>Header row</span>
              <span
                className={classes.dropdownToggle}
                onClick={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
              >
                <ToggleSwitch
                  value={hasHeaderRow}
                  setValue={() => actions.toggleHeaderRow()}
                  smallVersion
                />
              </span>
            </button>
            <div className={classes.dropdownDivider} />
            <button
              type="button"
              className={classes.dropdownItem}
              onClick={() => handleAction(actions.insertRowAbove)}
            >
              <span className={classes.icon}>↑</span>
              <span className={classes.dropdownItemText}>Insert row above</span>
            </button>
            <button
              type="button"
              className={classes.dropdownItem}
              onClick={() => handleAction(actions.insertRowBelow)}
            >
              <span className={classes.icon}>↓</span>
              <span className={classes.dropdownItemText}>Insert row below</span>
            </button>
            <button
              type="button"
              className={classNames(classes.dropdownItem, classes.dropdownItemDanger)}
              onClick={() => handleAction(actions.deleteRow)}
            >
              <span className={classes.icon}>×</span>
              <span className={classes.dropdownItemText}>Delete row</span>
            </button>
          </>
        )}
        {activeDropdown === 'merge' && (
          <>
            <button
              type="button"
              className={classes.dropdownItem}
              onClick={() => handleAction(actions.mergeCellUp)}
              disabled={!mergeCapabilities.canMergeUp}
            >
              <span className={classes.icon}>⬆</span>
              <span className={classes.dropdownItemText}>Merge cell up</span>
            </button>
            <button
              type="button"
              className={classes.dropdownItem}
              onClick={() => handleAction(actions.mergeCellRight)}
              disabled={!mergeCapabilities.canMergeRight}
            >
              <span className={classes.icon}>➡</span>
              <span className={classes.dropdownItemText}>Merge cell right</span>
            </button>
            <button
              type="button"
              className={classes.dropdownItem}
              onClick={() => handleAction(actions.mergeCellDown)}
              disabled={!mergeCapabilities.canMergeDown}
            >
              <span className={classes.icon}>⬇</span>
              <span className={classes.dropdownItemText}>Merge cell down</span>
            </button>
            <button
              type="button"
              className={classes.dropdownItem}
              onClick={() => handleAction(actions.mergeCellLeft)}
              disabled={!mergeCapabilities.canMergeLeft}
            >
              <span className={classes.icon}>⬅</span>
              <span className={classes.dropdownItemText}>Merge cell left</span>
            </button>
            <div className={classes.dropdownDivider} />
            <button
              type="button"
              className={classes.dropdownItem}
              onClick={() => handleAction(actions.splitCellVertically)}
              disabled={!mergeCapabilities.canSplitVertically}
            >
              <span className={classes.dropdownItemText}>Split cell vertically</span>
            </button>
            <button
              type="button"
              className={classes.dropdownItem}
              onClick={() => handleAction(actions.splitCellHorizontally)}
              disabled={!mergeCapabilities.canSplitHorizontally}
            >
              <span className={classes.dropdownItemText}>Split cell horizontally</span>
            </button>
          </>
        )}
      </div>,
      document.body
    );
  }

  return createPortal(
    <div ref={toolbarRef} className={classes.toolbar} style={toolbarStyle}>
      {/* Column operations */}
      <button
        type="button"
        className={classNames(classes.toolbarButton, classes.toolbarButtonWithDropdown, {
          [classes.toolbarButtonActive]: activeDropdown === 'column',
        })}
        onClick={() => toggleDropdown('column')}
        title="Column"
      >
        <ColumnIcon className={classes.tableIcon} />
        <span className={classes.dropdownArrow}>▼</span>
      </button>
      
      {/* Row operations */}
      <button
        type="button"
        className={classNames(classes.toolbarButton, classes.toolbarButtonWithDropdown, {
          [classes.toolbarButtonActive]: activeDropdown === 'row',
        })}
        onClick={() => toggleDropdown('row')}
        title="Row"
      >
        <RowIcon className={classes.tableIcon} />
        <span className={classes.dropdownArrow}>▼</span>
      </button>
      
      {/* Merge/Split operations - split button */}
      <div ref={mergeButtonRef} className={classes.splitButton}>
        <button
          type="button"
          className={classes.splitButtonMain}
          onClick={handleMergeMainClick}
          title={hasMultipleCellsSelected ? "Merge selected cells" : "Merge cells"}
        >
          <MergeIcon className={classes.tableIcon} />
        </button>
        <div className={classes.splitButtonDivider} />
        <button
          type="button"
          className={classNames(classes.splitButtonDropdown, {
            [classes.splitButtonDropdownActive]: activeDropdown === 'merge',
          })}
          onClick={() => toggleDropdown('merge')}
          title="Merge/split options"
        >
          <span>▼</span>
        </button>
      </div>
      
      {renderDropdown()}
    </div>,
    document.body
  );
}

export default TableToolbarPanel;
