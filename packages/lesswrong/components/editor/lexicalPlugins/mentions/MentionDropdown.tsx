"use client";

import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../../../hooks/useStyles';

const styles = defineStyles('MentionDropdown', (theme: ThemeType) => ({
  dropdown: {
    position: 'absolute',
    zIndex: 1000,
    backgroundColor: theme.palette.panelBackground.default,
    borderRadius: '6px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
    border: `1px solid ${theme.palette.grey[200]}`,
    maxHeight: '300px',
    overflowY: 'auto',
    minWidth: '200px',
    maxWidth: '350px',
  },
  list: {
    listStyle: 'none',
    margin: 0,
    padding: '4px 0',
  },
  item: {
    padding: '8px 12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    transition: 'background-color 0.1s',
    '&:hover': {
      backgroundColor: theme.palette.greyAlpha(0.08),
    },
  },
  itemSelected: {
    backgroundColor: theme.palette.primary.light,
    '&:hover': {
      backgroundColor: theme.palette.primary.light,
    },
  },
  itemContent: {
    flex: 1,
    minWidth: 0,
  },
  itemLabel: {
    fontSize: '14px',
    color: theme.palette.text.normal,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemDescription: {
    fontSize: '12px',
    color: theme.palette.grey[600],
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: theme.palette.grey[300],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 500,
    color: theme.palette.grey[700],
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  defaultItemInner: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  defaultItemContent: {
    flex: 1,
    minWidth: 0,
  },
  loading: {
    padding: '12px',
    textAlign: 'center',
    color: theme.palette.grey[500],
    fontSize: '13px',
  },
  empty: {
    padding: '12px',
    textAlign: 'center',
    color: theme.palette.grey[500],
    fontSize: '13px',
  },
}), { allowNonThemeColors: true });

/**
 * A mention item that can be displayed in the dropdown
 */
export interface MentionItem {
  /** Unique identifier (should start with the marker, e.g., "@username") */
  id: string;
  /** Display text (used as link text when inserted) */
  text?: string;
  /** URL to link to when the mention is inserted */
  link: string;
  /** Optional label to display (defaults to id) */
  label?: string;
  /** Optional description/subtitle */
  description?: string;
  /** Optional avatar URL */
  avatarUrl?: string;
  /** Any additional data */
  [key: string]: unknown;
}

interface MentionDropdownProps {
  isOpen: boolean;
  items: MentionItem[];
  selectedIndex: number;
  anchorRect: DOMRect | null;
  loading?: boolean;
  onSelect: (item: MentionItem) => void;
  onClose: () => void;
  renderItem?: (item: MentionItem) => React.ReactNode;
}

function MentionDropdown({
  isOpen,
  items,
  selectedIndex,
  anchorRect,
  loading = false,
  onSelect,
  onClose,
  renderItem,
}: MentionDropdownProps): React.ReactElement | null {
  const classes = useStyles(styles);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLLIElement>(null);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedItemRef.current && dropdownRef.current) {
      selectedItemRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedIndex]);

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleItemClick = useCallback((item: MentionItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(item);
  }, [onSelect]);

  if (!isOpen || !anchorRect) {
    return null;
  }

  // Calculate position - below the anchor
  // anchorRect is viewport-relative, but we need document-relative for absolute positioning
  const scrollX = typeof window !== 'undefined' ? window.scrollX : 0;
  const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
  
  const dropdownStyle: React.CSSProperties = {
    left: anchorRect.left + scrollX,
    top: anchorRect.bottom + scrollY + 4,
  };

  // Adjust if dropdown would go off-screen
  if (typeof window !== 'undefined') {
    const maxLeft = window.innerWidth - 360 + scrollX;
    if (anchorRect.left + scrollX > maxLeft) {
      dropdownStyle.left = Math.max(8 + scrollX, maxLeft);
    }
    
    // If there's not enough space below, show above
    const spaceBelow = window.innerHeight - anchorRect.bottom;
    if (spaceBelow < 200 && anchorRect.top > 200) {
      dropdownStyle.top = anchorRect.top + scrollY - 4;
      // We'll need to position from bottom of dropdown, so use transform
      dropdownStyle.transform = 'translateY(-100%)';
    }
  }

  const renderDefaultItem = (item: MentionItem) => {
    const label = item.label || item.id;
    const initials = label.replace(/^[@#]/, '').slice(0, 2).toUpperCase();

    return (
      <div className={classes.itemContent}>
        <div className={classes.defaultItemInner}>
          <div className={classes.avatar}>
            {item.avatarUrl ? (
              <img src={item.avatarUrl} alt="" className={classes.avatarImage} />
            ) : (
              initials
            )}
          </div>
          <div className={classes.defaultItemContent}>
            <div className={classes.itemLabel}>{label}</div>
            {item.description && (
              <div className={classes.itemDescription}>{item.description}</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return createPortal(
    <div
      ref={dropdownRef}
      className={classes.dropdown}
      style={dropdownStyle}
    >
      {loading ? (
        <div className={classes.loading}>Loading...</div>
      ) : items.length === 0 ? (
        <div className={classes.empty}>No matches found</div>
      ) : (
        <ul className={classes.list} role="listbox">
          {items.map((item, index) => {
            const isSelected = index === selectedIndex;
            return (
              <li
                key={item.id}
                ref={isSelected ? selectedItemRef : null}
                className={classNames(classes.item, { [classes.itemSelected]: isSelected })}
                role="option"
                aria-selected={isSelected}
                onClick={(e) => handleItemClick(item, e)}
              >
                {renderItem ? renderItem(item) : renderDefaultItem(item)}
              </li>
            );
          })}
        </ul>
      )}
    </div>,
    document.body
  );
}

export default MentionDropdown;


