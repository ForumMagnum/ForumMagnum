'use client';

import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ForumIcon from '@/components/common/ForumIcon';

const styles = defineStyles('SupermodAgentLauncherButton', (theme: ThemeType) => ({
  // Matches LanguageModelLauncherButton, but bottom-right proper: supermod
  // hides the site-wide floating buttons (including Intercom), so the corner
  // is free.
  root: {
    position: 'fixed',
    bottom: 20,
    right: 20,
    zIndex: theme.zIndexes.languageModelChatButton,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '50%',
    width: 48,
    height: 48,
    padding: 10,
    cursor: 'pointer',
    backgroundColor: theme.palette.grey[100],
    boxShadow: `0 1px 6px 0 ${theme.palette.greyAlpha(0.06)}, 0 2px 32px 0 ${theme.palette.greyAlpha(0.16)}`,
    '&:hover': {
      boxShadow: `0 6px 8px ${theme.palette.greyAlpha(0.2)}`,
    },
  },
  icon: {
    width: 24,
    height: 24,
  },
}));

/** Floating sparkle button that opens the supermod agent chat overlay (same affordance as the site-wide LLM chat launcher) */
const SupermodAgentLauncherButton = ({ onClick }: { onClick: () => void }) => {
  const classes = useStyles(styles);
  return (
    <div className={classes.root} onClick={onClick} title="Agent chat (T)">
      <ForumIcon icon="Sparkles" className={classes.icon} />
    </div>
  );
};

export default SupermodAgentLauncherButton;
