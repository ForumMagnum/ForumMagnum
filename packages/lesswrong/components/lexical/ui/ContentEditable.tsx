/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { type JSX } from 'react';

import {ContentEditable} from '@lexical/react/LexicalContentEditable';


import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('LexicalContentEditable', (theme: ThemeType) => ({
  root: {
    border: 0,
    fontSize: 15,
    display: 'block',
    position: 'relative',
    outline: 0,
    padding: '8px 46px 40px',
    minHeight: 150,
    '@media (max-width: 1025px)': {
      paddingLeft: 8,
      paddingRight: 8,
    },
  },
  placeholder: {
    fontSize: 15,
    color: theme.palette.grey[550],
    overflow: 'hidden',
    position: 'absolute',
    textOverflow: 'ellipsis',
    top: 8,
    left: 46,
    right: 28,
    userSelect: 'none',
    whiteSpace: 'nowrap',
    display: 'inline-block',
    pointerEvents: 'none',
    '@media (max-width: 1025px)': {
      left: 8,
      right: 8,
    },
  },
}));

type Props = {
  className?: string;
  placeholderClassName?: string;
  placeholder: string;
};

export default function LexicalContentEditable({
  className,
  placeholder,
  placeholderClassName,
}: Props): JSX.Element {
  const classes = useStyles(styles);
  return (
    <ContentEditable
      className={classNames(classes.root, className)}
      aria-placeholder={placeholder}
      placeholder={
        <div className={classNames(classes.placeholder, placeholderClassName)}>
          {placeholder}
        </div>
      }
    />
  );
}
