/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { type JSX } from 'react';



import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('LexicalSelect', (theme: ThemeType) => ({
  wrapper: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    display: 'flex',
    flex: 1,
    marginTop: '-1em',
    color: theme.palette.grey[680],
  },
  select: {
    minWidth: 160,
    maxWidth: 290,
    border: `1px solid ${theme.palette.grey[800]}`,
    borderRadius: '0.25em',
    padding: '0.25em 0.5em',
    fontSize: '1rem',
    cursor: 'pointer',
    lineHeight: 1.4,
    background: `linear-gradient(to bottom, ${theme.palette.panelBackground.default} 0%, ${theme.palette.grey[250]} 100%)`,
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    backgroundColor: 'transparent',
    margin: 0,
    fontFamily: 'inherit',
    zIndex: 1,
    outline: 'none',
  },
}));

type SelectIntrinsicProps = JSX.IntrinsicElements['select'];
interface SelectProps extends SelectIntrinsicProps {
  label: string;
}

export default function Select({
  children,
  label,
  className,
  ...other
}: SelectProps): JSX.Element {
  const classes = useStyles(styles);
  return (
    <div className={classes.wrapper}>
      <label className={classes.label}>
        {label}
      </label>
      <select {...other} className={classNames(classes.select, className)}>
        {children}
      </select>
    </div>
  );
}
