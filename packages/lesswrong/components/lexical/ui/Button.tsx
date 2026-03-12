/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { type JSX } from 'react';


import {ReactNode} from 'react';

import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('LexicalButton', (theme: ThemeType) => ({
  root: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 15,
    paddingRight: 15,
    border: 0,
    backgroundColor: theme.palette.grey[200],
    borderRadius: 5,
    cursor: 'pointer',
    fontSize: 14,
    '&:hover': {
      backgroundColor: theme.palette.grey[300],
    },
  },
  small: {
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 10,
    paddingRight: 10,
    fontSize: 13,
  },
  disabled: {
    cursor: 'not-allowed',
    '&:hover': {
      backgroundColor: theme.palette.grey[200],
    },
  },
}));

export default function Button({
  'data-test-id': dataTestId,
  children,
  className,
  onClick,
  disabled,
  small,
  title,
}: {
  'data-test-id'?: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick: () => void;
  small?: boolean;
  title?: string;
}): JSX.Element {
  const classes = useStyles(styles);
  return (
    <button
      disabled={disabled}
      className={classNames(
        classes.root,
        disabled && classes.disabled,
        small && classes.small,
        className,
      )}
      onClick={onClick}
      title={title}
      aria-label={title}
      {...(dataTestId && {'data-test-id': dataTestId})}>
      {children}
    </button>
  );
}
