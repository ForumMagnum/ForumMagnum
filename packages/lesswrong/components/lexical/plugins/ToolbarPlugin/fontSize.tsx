/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {LexicalEditor} from 'lexical';

import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';

import {
  MAX_ALLOWED_FONT_SIZE,
  MIN_ALLOWED_FONT_SIZE,
} from '../../context/ToolbarContext';
import {isKeyboardInput} from '../../utils/focusUtils';
import {SHORTCUTS} from '../ShortcutsPlugin/shortcuts';
import {
  updateFontSize,
  updateFontSizeInSelection,
  UpdateFontSizeType,
} from './utils';

import React from 'react';
import { AddSignIcon } from '../../icons/AddSignIcon';
import { MinusSignIcon } from '../../icons/MinusSignIcon';
import { toolbarItem, formatIcon } from '../../styles/toolbarStyles';

const styles = defineStyles('LexicalFontSize', (theme: ThemeType) => ({
  toolbarItem: toolbarItem(theme),
  fontSizeInput: {
    ...toolbarItem(theme),
    fontWeight: 'bold',
    fontSize: 14,
    color: theme.palette.grey[600],
    borderRadius: 5,
    borderColor: theme.palette.grey[500],
    height: 15,
    padding: '2px 4px',
    textAlign: 'center',
    width: 20,
    alignSelf: 'center',
    '&:disabled': {
      opacity: 0.2,
      cursor: 'not-allowed',
    },
    // Hide number input spinners
    '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
      WebkitAppearance: 'none',
      margin: 0,
    },
    MozAppearance: 'textfield',
  },
  formatIcon: formatIcon(),
  fontDecrement: {
    ...toolbarItem(theme),
    padding: 0,
    marginRight: 3,
  },
  fontIncrement: {
    ...toolbarItem(theme),
    padding: 0,
    marginLeft: 3,
  },
}));

function parseFontSize(input: string): [number, string] | null {
  const match = input.match(/^(\d+(?:\.\d+)?)(px|pt)$/);
  return match ? [Number(match[1]), match[2]] : null;
}

function normalizeToPx(fontSize: number, unit: string): number {
  return unit === 'pt' ? Math.round((fontSize * 4) / 3) : fontSize;
}

function isValidFontSize(fontSizePx: number): boolean {
  return (
    fontSizePx >= MIN_ALLOWED_FONT_SIZE && fontSizePx <= MAX_ALLOWED_FONT_SIZE
  );
}

export function parseFontSizeForToolbar(input: string): string {
  const parsed = parseFontSize(input);
  if (!parsed) {
    return '';
  }

  const [fontSize, unit] = parsed;
  const fontSizePx = normalizeToPx(fontSize, unit);
  return `${fontSizePx}px`;
}

export function parseAllowedFontSize(input: string): string {
  const parsed = parseFontSize(input);
  if (!parsed) {
    return '';
  }

  const [fontSize, unit] = parsed;
  const fontSizePx = normalizeToPx(fontSize, unit);
  return isValidFontSize(fontSizePx) ? input : '';
}

export default function FontSize({
  selectionFontSize,
  disabled,
  editor,
}: {
  selectionFontSize: string;
  disabled: boolean;
  editor: LexicalEditor;
}) {
  const classes = useStyles(styles);
  const [inputValue, setInputValue] = React.useState<string>(selectionFontSize);
  const [inputChangeFlag, setInputChangeFlag] = React.useState<boolean>(false);
  const [isMouseMode, setIsMouseMode] = React.useState(false);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const inputValueNumber = Number(inputValue);

    if (e.key === 'Tab') {
      return;
    }
    if (['e', 'E', '+', '-'].includes(e.key) || isNaN(inputValueNumber)) {
      e.preventDefault();
      setInputValue('');
      return;
    }
    setInputChangeFlag(true);
    if (e.key === 'Enter' || e.key === 'Escape') {
      e.preventDefault();

      updateFontSizeByInputValue(inputValueNumber, !isMouseMode);
    }
  };

  const handleInputBlur = () => {
    setIsMouseMode(false);

    if (inputValue !== '' && inputChangeFlag) {
      const inputValueNumber = Number(inputValue);
      updateFontSizeByInputValue(inputValueNumber);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    setIsMouseMode(true);
  };

  const updateFontSizeByInputValue = (
    inputValueNumber: number,
    skipRefocus: boolean = false,
  ) => {
    let updatedFontSize = inputValueNumber;
    if (inputValueNumber > MAX_ALLOWED_FONT_SIZE) {
      updatedFontSize = MAX_ALLOWED_FONT_SIZE;
    } else if (inputValueNumber < MIN_ALLOWED_FONT_SIZE) {
      updatedFontSize = MIN_ALLOWED_FONT_SIZE;
    }

    setInputValue(String(updatedFontSize));
    updateFontSizeInSelection(
      editor,
      String(updatedFontSize) + 'px',
      null,
      skipRefocus,
    );
    setInputChangeFlag(false);
  };

  React.useEffect(() => {
    setInputValue(selectionFontSize);
  }, [selectionFontSize]);

  return (
    <>
      <button
        type="button"
        disabled={
          disabled ||
          (selectionFontSize !== '' &&
            Number(inputValue) <= MIN_ALLOWED_FONT_SIZE)
        }
        onClick={(e) => {
          updateFontSize(
            editor,
            UpdateFontSizeType.decrement,
            inputValue,
            isKeyboardInput(e),
          );
        }}
        className={classes.fontDecrement}
        aria-label="Decrease font size"
        title={`Decrease font size (${SHORTCUTS.DECREASE_FONT_SIZE})`}>
        <MinusSignIcon className={classes.formatIcon} />
      </button>

      <input
        type="number"
        title="Font size"
        value={inputValue}
        disabled={disabled}
        className={classes.fontSizeInput}
        min={MIN_ALLOWED_FONT_SIZE}
        max={MAX_ALLOWED_FONT_SIZE}
        onChange={(e) => setInputValue(e.target.value)}
        onClick={handleClick}
        onKeyDown={handleKeyPress}
        onBlur={handleInputBlur}
      />

      <button
        type="button"
        disabled={
          disabled ||
          (selectionFontSize !== '' &&
            Number(inputValue) >= MAX_ALLOWED_FONT_SIZE)
        }
        onClick={(e) => {
          updateFontSize(
            editor,
            UpdateFontSizeType.increment,
            inputValue,
            isKeyboardInput(e),
          );
        }}
        className={classes.fontIncrement}
        aria-label="Increase font size"
        title={`Increase font size (${SHORTCUTS.INCREASE_FONT_SIZE})`}>
        <AddSignIcon className={classes.formatIcon} />
      </button>
    </>
  );
}
