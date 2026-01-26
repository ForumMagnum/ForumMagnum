/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { type JSX } from 'react';


import {ReactNode} from 'react';
import {createPortal} from 'react-dom';

import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('LexicalFlashMessage', (theme: ThemeType) => ({
  overlay: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'fixed',
    pointerEvents: 'none',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  alert: {
    backgroundColor: theme.palette.greyAlpha(0.8),
    color: theme.palette.text.alwaysWhite,
    padding: '0.5em 1.5em',
    fontSize: '1.5rem',
    borderRadius: '1em',
  },
}));

export interface FlashMessageProps {
  children: ReactNode;
}

export default function FlashMessage({
  children,
}: FlashMessageProps): JSX.Element {
  const classes = useStyles(styles);
  return createPortal(
    <div className={classes.overlay} role="dialog">
      <p className={classes.alert} role="alert">
        {children}
      </p>
    </div>,
    document.body,
  );
}
