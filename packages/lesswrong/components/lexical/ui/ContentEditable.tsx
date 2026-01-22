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
    display: 'block',
    position: 'relative',
    outline: 0,
    minHeight: 150,
    '@media (max-width: 1025px)': {
      paddingLeft: 8,
      paddingRight: 8,
    },
  },
  rootComment: {
    fontSize: 14,
    padding: '8px 12px',
    minHeight: 'var(--lexical-comment-min-height, 60px)',
  },
  placeholder: {
    fontSize: 15,
    color: theme.palette.grey[550],
    overflow: 'hidden',
    position: 'absolute',
    textOverflow: 'ellipsis',
    top: 0,
    left: 0,
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
  placeholderComment: {
    fontSize: 14,
    top: 'var(--lexical-comment-placeholder-top, 8px)',
    left: 'var(--lexical-comment-placeholder-left, 12px)',
    transform: 'var(--lexical-comment-placeholder-transform, none)',
    whiteSpace: 'normal',
  },
}));

type Props = {
  className?: string;
  placeholderClassName?: string;
  placeholder: string;
  variant?: 'comment';
};

export default function LexicalContentEditable({
  className,
  placeholder,
  placeholderClassName,
  variant,
}: Props): JSX.Element {
  const classes = useStyles(styles);
  return (
    <ContentEditable
      className={classNames(classes.root, variant === 'comment' && classes.rootComment, className)}
      aria-placeholder={placeholder}
      placeholder={
        <div
          className={classNames(
            classes.placeholder,
            variant === 'comment' && classes.placeholderComment,
            placeholderClassName,
          )}
        >
          {placeholder}
        </div>
      }
    />
  );
}
