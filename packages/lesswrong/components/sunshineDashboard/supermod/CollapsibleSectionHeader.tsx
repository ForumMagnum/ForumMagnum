import React from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ForumIcon from '@/components/common/ForumIcon';
import ModerationSectionTitle from './ModerationSectionTitle';
import KeystrokeDisplay from './KeystrokeDisplay';

const styles = defineStyles('CollapsibleSectionHeader', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    marginBottom: 6,
  },
  minimal: {
    marginBottom: 0,
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  toggleButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    border: 0,
    background: 'none',
    color: theme.palette.grey[600],
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.grey[800],
    },
  },
  chevron: {
    fontSize: 16,
  },
}));

const CollapsibleSectionHeader = ({ title, keystroke, expanded, minimal = false, onToggle }: {
  title: string,
  keystroke?: string,
  expanded: boolean,
  minimal?: boolean,
  onToggle: () => void,
}) => {
  const classes = useStyles(styles);

  return <div className={classNames(classes.root, { [classes.minimal]: minimal })}>
    <ModerationSectionTitle>{title}</ModerationSectionTitle>
    <div className={classes.controls}>
      {keystroke && <KeystrokeDisplay keystroke={keystroke} />}
      <button
        type="button"
        className={classes.toggleButton}
        onClick={onToggle}
        aria-label={expanded ? `Close ${title}` : `Open ${title}`}
        aria-expanded={expanded}
      >
        <ForumIcon
          icon={expanded ? "ThickChevronDown" : "ThickChevronRight"}
          className={classes.chevron}
        />
      </button>
    </div>
  </div>;
};

export default CollapsibleSectionHeader;
