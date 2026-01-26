/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { type JSX } from 'react';

import {calculateZoomLevel} from '@lexical/utils';
import {isDOMNode} from 'lexical';

import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {createPortal} from 'react-dom';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

import {focusNearestDescendant, isKeyboardInput} from '../utils/focusUtils';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import ForumIcon from '@/components/common/ForumIcon';
import classNames from 'classnames';

const styles = defineStyles('LexicalDropDown', (theme: ThemeType) => ({
  chevronDown: {
    display: 'flex',
    userSelect: 'none' as const,
    backgroundColor: 'transparent',
    backgroundSize: 'contain',
    height: 8,
    width: 8,
  },
  dropdown: {
    zIndex: 100,
    display: 'block',
    position: 'fixed',
    boxShadow: `0 12px 28px 0 ${theme.palette.greyAlpha(0.2)}, 0 2px 4px 0 ${theme.palette.greyAlpha(0.1)}, inset 0 0 0 1px ${theme.palette.inverseGreyAlpha(0.5)}`,
    borderRadius: 8,
    minHeight: 40,
    backgroundColor: theme.palette.grey[0],
  },
  item: {
    margin: '0 8px',
    padding: 8,
    color: theme.palette.grey[1000],
    cursor: 'pointer',
    lineHeight: '16px',
    fontSize: 15,
    display: 'flex',
    alignContent: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    justifyContent: 'space-between',
    backgroundColor: theme.palette.grey[0],
    borderRadius: 8,
    border: 0,
    maxWidth: 264,
    minWidth: 100,
    '&:first-child': {
      marginTop: 8,
    },
    '&:last-child': {
      marginBottom: 8,
    },
    '&:hover': {
      backgroundColor: theme.palette.grey[200],
    },
  },
  itemWide: {
    alignItems: 'center',
    width: 260,
  },
  iconTextContainer: {
    display: 'flex',
    '& .text': {
      minWidth: 120,
    },
  },
  shortcut: {
    color: theme.palette.grey[500],
    alignSelf: 'flex-end',
  },
  active: {
    display: 'flex',
    width: 20,
    height: 20,
    backgroundSize: 'contain',
  },
  text: {
    display: 'flex',
    lineHeight: '20px',
    flexGrow: 1,
    minWidth: 150,
  },
  icon: {
    display: 'flex',
    width: 20,
    height: 20,
    userSelect: 'none',
    marginRight: 12,
    lineHeight: '16px',
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  },
  divider: {
    width: 'auto',
    backgroundColor: theme.palette.grey[200],
    margin: '4px 8px',
    height: 1,
  },
  dropdownItemActive: {
    backgroundColor: theme.palette.greyAlpha(0.05),
    '& i': {
      opacity: 1,
    },
  },
}));

type DropDownContextType = {
  registerItem: (ref: React.RefObject<null | HTMLButtonElement>) => void;
};

const DropDownContext = React.createContext<DropDownContextType | null>(null);

const dropDownPadding = 4;

export function DropDownItemIconTextContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const classes = useStyles(styles);
  return <div className={classNames(classes.iconTextContainer, className)}>{children}</div>;
}

export function DropDownItemText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const classes = useStyles(styles);
  return <span className={classNames(classes.text, className)}>{children}</span>;
}

export function DropDownItemShortcut({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const classes = useStyles(styles);
  return <span className={classNames(classes.shortcut, className)}>{children}</span>;
}

export function DropDownItem({
  children,
  className,
  wide = false,
  active = false,
  onClick,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
  active?: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  title?: string;
}) {
  const classes = useStyles(styles);
  const ref = useRef<null | HTMLButtonElement>(null);

  const dropDownContext = React.useContext(DropDownContext);

  if (dropDownContext === null) {
    throw new Error('DropDownItem must be used within a DropDown');
  }

  const {registerItem} = dropDownContext;

  useEffect(() => {
    if (ref && ref.current) {
      registerItem(ref);
    }
  }, [ref, registerItem]);

  return (
    <button
      className={classNames(
        classes.item,
        wide && classes.itemWide,
        active && classes.dropdownItemActive,
        className,
      )}
      onClick={onClick}
      ref={ref}
      title={title}
      type="button">
      {children}
    </button>
  );
}

function DropDownItems({
  children,
  dropDownRef,
  onClose,
  autofocus,
}: {
  children: React.ReactNode;
  dropDownRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  autofocus: boolean;
}) {
  const [items, setItems] =
    useState<React.RefObject<null | HTMLButtonElement>[]>();
  const [highlightedItem, setHighlightedItem] =
    useState<React.RefObject<null | HTMLButtonElement>>();

  const registerItem = useCallback(
    (itemRef: React.RefObject<null | HTMLButtonElement>) => {
      setItems((prev) => (prev ? [...prev, itemRef] : [itemRef]));
    },
    [setItems],
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const key = event.key;
    if (key === 'Escape') {
      onClose();
    }
    if (!items) {
      return;
    }

    if (['Escape', 'ArrowUp', 'ArrowDown', 'Tab'].includes(key)) {
      event.preventDefault();
    }

    if (key === 'Escape' || key === 'Tab') {
      onClose();
    } else if (key === 'ArrowUp') {
      setHighlightedItem((prev) => {
        if (!prev) {
          return items[0];
        }
        const index = items.indexOf(prev) - 1;
        return items[index === -1 ? items.length - 1 : index];
      });
    } else if (key === 'ArrowDown') {
      setHighlightedItem((prev) => {
        if (!prev) {
          return items[0];
        }
        return items[items.indexOf(prev) + 1];
      });
    }
  };

  const contextValue = useMemo(
    () => ({
      registerItem,
    }),
    [registerItem],
  );

  useEffect(() => {
    if (items && !highlightedItem) {
      setHighlightedItem(items[0]);
    }

    if (highlightedItem && highlightedItem.current) {
      highlightedItem.current.focus();
    }
  }, [items, highlightedItem]);

  useEffect(() => {
    if (autofocus && dropDownRef.current) {
      focusNearestDescendant(dropDownRef.current);
    }
  }, [autofocus, dropDownRef]);

  const classes = useStyles(styles);

  return (
    <DropDownContext.Provider value={contextValue}>
      <div className={classes.dropdown} ref={dropDownRef} onKeyDown={handleKeyDown}>
        {children}
      </div>
    </DropDownContext.Provider>
  );
}

export default function DropDown({
  disabled = false,
  buttonLabel,
  buttonAriaLabel,
  buttonClassName,
  buttonIconClassName,
  buttonIcon,
  children,
  stopCloseOnClickSelf,
  hideChevron,
}: {
  disabled?: boolean;
  buttonAriaLabel?: string;
  buttonClassName: string;
  buttonIconClassName?: string;
  buttonIcon?: ReactNode;
  buttonLabel?: string;
  children: ReactNode;
  stopCloseOnClickSelf?: boolean;
  hideChevron?: boolean;
}): JSX.Element {
  const classes = useStyles(styles);
  const dropDownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [showDropDown, setShowDropDown] = useState(false);
  const [shouldAutofocus, setShouldAutofocus] = useState(false);

  const handleClose = () => {
    setShowDropDown(false);
    if (buttonRef && buttonRef.current) {
      buttonRef.current.focus();
    }
  };

  useEffect(() => {
    const button = buttonRef.current;
    const dropDown = dropDownRef.current;
    const zoom = calculateZoomLevel(dropDown);
    if (showDropDown && button !== null && dropDown !== null) {
      const {top, left} = button.getBoundingClientRect();
      dropDown.style.top = `${(top / zoom) + button.offsetHeight + dropDownPadding}px`;
      dropDown.style.left = `${
        Math.min(left, window.innerWidth - dropDown.offsetWidth - 20) / zoom
      }px`;
    }
  }, [dropDownRef, buttonRef, showDropDown]);

  useEffect(() => {
    const button = buttonRef.current;

    if (button !== null && showDropDown) {
      const handle = (event: PointerEvent) => {
        const target = event.target;
        if (!isDOMNode(target)) {
          return;
        }

        const targetIsDropDownItem =
          dropDownRef.current && dropDownRef.current.contains(target);
        if (stopCloseOnClickSelf && targetIsDropDownItem) {
          return;
        }

        if (!button.contains(target)) {
          setShowDropDown(false);

          if (targetIsDropDownItem && isKeyboardInput(event)) {
            button.focus();
          }
        }
      };
      document.addEventListener('click', handle);

      return () => {
        document.removeEventListener('click', handle);
      };
    }
  }, [dropDownRef, buttonRef, showDropDown, stopCloseOnClickSelf]);

  useEffect(() => {
    const handleButtonPositionUpdate = () => {
      if (showDropDown) {
        const button = buttonRef.current;
        const dropDown = dropDownRef.current;
        if (button !== null && dropDown !== null) {
          const {top} = button.getBoundingClientRect();
          const newPosition = top + button.offsetHeight + dropDownPadding;
          if (newPosition !== dropDown.getBoundingClientRect().top) {
            dropDown.style.top = `${newPosition}px`;
          }
        }
      }
    };

    document.addEventListener('scroll', handleButtonPositionUpdate);

    return () => {
      document.removeEventListener('scroll', handleButtonPositionUpdate);
    };
  }, [buttonRef, dropDownRef, showDropDown]);

  const handleOnClick = (e: React.MouseEvent) => {
    setShowDropDown(!showDropDown);
    setShouldAutofocus(isKeyboardInput(e));
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        aria-label={buttonAriaLabel || buttonLabel}
        className={buttonClassName}
        onClick={handleOnClick}
        ref={buttonRef}>
        {buttonIcon}
        {buttonIconClassName && !buttonIcon && <span className={buttonIconClassName} />}
        {buttonLabel && (
          <span className="text dropdown-button-text">{buttonLabel}</span>
        )}
        {!hideChevron && <ForumIcon icon="ThickChevronDown" className={classes.chevronDown} />}
      </button>

      {showDropDown &&
        createPortal(
          <DropDownItems
            dropDownRef={dropDownRef}
            onClose={handleClose}
            autofocus={shouldAutofocus}>
            {children}
          </DropDownItems>,
          document.body,
        )}
    </>
  );
}
