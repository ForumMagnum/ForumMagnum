'use client';

import React from 'react';
import { Paper } from '@/components/widgets/Paper';
import Check from '@/lib/vendor/@material-ui/icons/src/Check';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';
import LWTooltip from '../common/LWTooltip';
import ForumIcon from '../common/ForumIcon';
import { MenuItem } from '../common/Menus';
import {
  getAvailableEditorModes,
  editorModeLabels,
  editorModeIcons,
  type EditorUserModeType,
} from '../editor/lexicalPlugins/suggestions/EditorUserMode';

const styles = defineStyles('EditorModeMenuButton', (theme: ThemeType) => ({
  button: {
    width: 28,
    height: 28,
    border: 'none',
    borderRadius: 4,
    background: 'transparent',
    color: theme.palette.text.dim,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    '&:hover': {
      background: theme.palette.greyAlpha(0.06),
      color: theme.palette.text.primary,
    },
  },
  icon: {
    '--icon-size': '16px',
  },
  check: {
    width: 16,
    marginRight: 8,
  },
  notChecked: {
    width: 16,
    marginRight: 8,
  },
  menuItemIcon: {
    '--icon-size': '16px',
    marginRight: 8,
    color: theme.palette.text.dim,
  },
}));

/**
 * Compact editor-mode (Editing/Suggesting/Viewing) control: a single icon
 * button showing the current mode, with a hover menu to switch. Deliberately
 * low-key — in the research workspace the sole user rarely needs to change
 * their own input mode (this gets more important with multiplayer).
 */
const EditorModeMenuButton = ({ userMode, setUserMode }: {
  userMode: EditorUserModeType;
  setUserMode: (mode: EditorUserModeType) => void;
}) => {
  const classes = useStyles(styles);

  const menu = (
    <Paper>
      {getAvailableEditorModes(true, true).map((mode) => (
        <MenuItem key={mode} onClick={() => setUserMode(mode)}>
          {mode === userMode
            ? <Check className={classes.check} />
            : <div className={classes.notChecked} />}
          <ForumIcon icon={editorModeIcons[mode]} className={classes.menuItemIcon} />
          {editorModeLabels[mode]}
        </MenuItem>
      ))}
    </Paper>
  );

  return (
    <LWTooltip
      title={menu}
      tooltip={false}
      clickable={true}
      inlineBlock={false}
      placement="bottom-end"
    >
      <button
        type="button"
        className={classes.button}
        aria-label={`Editor mode: ${editorModeLabels[userMode]}`}
      >
        <ForumIcon icon={editorModeIcons[userMode]} className={classes.icon} />
      </button>
    </LWTooltip>
  );
};

export default EditorModeMenuButton;
