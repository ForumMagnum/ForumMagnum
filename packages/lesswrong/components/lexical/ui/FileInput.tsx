/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { type JSX } from 'react';


import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('LexicalFileInput', (theme: ThemeType) => ({
  wrapper: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    display: 'flex',
    flex: 1,
    color: theme.palette.grey[600],
  },
  input: {
    display: 'flex',
    flex: 2,
    border: `1px solid ${theme.palette.grey[500]}`,
    paddingTop: 7,
    paddingBottom: 7,
    paddingLeft: 10,
    paddingRight: 10,
    fontSize: 16,
    borderRadius: 5,
    minWidth: 0,
  },
}));

type Props = Readonly<{
  'data-test-id'?: string;
  accept?: string;
  label: string;
  onChange: (files: FileList | null) => void;
}>;

export default function FileInput({
  accept,
  label,
  onChange,
  'data-test-id': dataTestId,
}: Props): JSX.Element {
  const classes = useStyles(styles);
  return (
    <div className={classes.wrapper}>
      <label className={classes.label}>{label}</label>
      <input
        type="file"
        accept={accept}
        className={classes.input}
        onChange={(e) => onChange(e.target.files)}
        data-test-id={dataTestId}
      />
    </div>
  );
}
