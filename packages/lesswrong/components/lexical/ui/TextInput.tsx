/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { type JSX } from 'react';


import {HTMLInputTypeAttribute} from 'react';

import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('LexicalTextInput', (theme: ThemeType) => ({
  wrapper: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    display: 'flex',
    flex: 1,
    color: theme.palette.grey[680],
    ...theme.typography.commentStyle,
  },
  input: {
    display: 'flex',
    flex: 2,
    border: `1px solid ${theme.palette.grey[550]}`,
    paddingTop: 7,
    paddingBottom: 7,
    paddingLeft: 10,
    paddingRight: 10,
    fontSize: 16,
    borderRadius: 5,
    minWidth: 0,
    "&:focus": {
      // We have a global style that sets border: 0 on `input:focus`, which causes annoying layout shifts
      border: `1px solid ${theme.palette.grey[550]}`,
    },
  },
}));

type Props = Readonly<{
  'data-test-id'?: string;
  label: string;
  onChange: (val: string) => void;
  placeholder?: string;
  value: string;
  type?: HTMLInputTypeAttribute;
}>;

export default function TextInput({
  label,
  value,
  onChange,
  placeholder = '',
  'data-test-id': dataTestId,
  type = 'text',
}: Props): JSX.Element {
  const classes = useStyles(styles);
  return (
    <div className={classes.wrapper}>
      <label className={classes.label}>{label}</label>
      <input
        type={type}
        className={classes.input}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        data-test-id={dataTestId}
      />
    </div>
  );
}
