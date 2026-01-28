import React, { type JSX } from 'react';

import { getLanguageFriendlyName, normalizeCodeLang } from '@lexical/code';
import classNames from 'classnames';

import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('LexicalCodeActionMenu', (theme: ThemeType) => ({
  container: {
    height: 35.8,
    fontSize: 10,
    color: theme.palette.greyAlpha(0.5),
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row',
    userSelect: 'none',
  },
  highlightLanguage: {
    marginRight: 4,
  },
  menuItem: {
    border: '1px solid transparent',
    borderRadius: 4,
    padding: 4,
    background: 'none',
    cursor: 'pointer',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    color: theme.palette.greyAlpha(0.5),
    textTransform: 'uppercase',
    '& i.format': {
      height: 16,
      width: 16,
      opacity: 0.6,
      display: 'flex',
      color: theme.palette.greyAlpha(0.5),
      backgroundSize: 'contain',
    },
    '&:hover': {
      border: `1px solid ${theme.palette.greyAlpha(0.3)}`,
      opacity: 0.9,
    },
    '&:active': {
      backgroundColor: theme.palette.lexicalEditor.codeActionMenuBackground,
      border: `1px solid ${theme.palette.greyAlpha(0.45)}`,
    },
  },
}));

export interface CodeActionMenuPosition {
  top: string;
  right: string;
}

interface CodeActionMenuProps {
  isShown: boolean;
  language: string;
  position: CodeActionMenuPosition;
  renderMenuItems: (menuItemClassName: string) => React.ReactNode;
}

export const CodeActionMenu = ({
  isShown,
  language,
  position,
  renderMenuItems,
}: CodeActionMenuProps): JSX.Element | null => {
  const classes = useStyles(styles);
  const normalizedLang = normalizeCodeLang(language);
  const codeFriendlyName = getLanguageFriendlyName(normalizedLang || language);

  if (!isShown) {
    return null;
  }

  return (
    <div
      className={classNames(classes.container, 'code-action-menu-container')}
      style={{ ...position }}
    >
      <div className={classes.highlightLanguage}>{codeFriendlyName}</div>
      {renderMenuItems(classes.menuItem)}
    </div>
  );
};
