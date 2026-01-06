/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { type JSX } from 'react';


import {ReactNode} from 'react';

import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('LexicalDialog', (theme: ThemeType) => ({
  actions: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'right',
    marginTop: 20,
  },
  buttonsList: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'right',
    marginTop: 20,
    '& button': {
      marginBottom: 20,
    },
  },
}));

type Props = Readonly<{
  'data-test-id'?: string;
  children: ReactNode;
}>;

export function DialogButtonsList({children}: Props): JSX.Element {
  const classes = useStyles(styles);
  return <div className={classes.buttonsList}>{children}</div>;
}

export function DialogActions({
  'data-test-id': dataTestId,
  children,
}: Props): JSX.Element {
  const classes = useStyles(styles);
  return (
    <div className={classes.actions} data-test-id={dataTestId}>
      {children}
    </div>
  );
}
