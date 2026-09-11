"use client";

import React from 'react';
import classNames from 'classnames';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('KeyboardShortcut', (theme: ThemeType) => ({
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    flexShrink: 0,
    padding: '2px 5px',
    fontFamily: theme.typography.code.fontFamily,
    fontSize: 11,
    fontWeight: 400,
    lineHeight: '16px',
    whiteSpace: 'nowrap',
    color: theme.palette.text.dim,
    backgroundColor: theme.palette.greyAlpha(0.04),
    border: theme.palette.greyBorder('1px', 0.16),
    borderRadius: 3,
    boxShadow: `0 1px 0 ${theme.palette.greyAlpha(0.08)}`,
  },
}));

interface KeyboardShortcutProps {
  children: React.ReactNode,
  className?: string,
}

/** A compact, theme-aware keycap for displaying a keyboard shortcut. */
const KeyboardShortcut = ({children, className}: KeyboardShortcutProps) => {
  const classes = useStyles(styles);
  return <kbd className={classNames(classes.root, className)}>{children}</kbd>;
};

export default KeyboardShortcut;
