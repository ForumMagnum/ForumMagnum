"use client";

import React from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import InlineSelect, { Option } from '@/components/common/InlineSelect';
import UnfoldLessIcon from '@/lib/vendor/@material-ui/icons/src/UnfoldLess';
import UnfoldMoreDoubleIcon from '@/lib/vendor/@material-ui/icons/src/UnfoldMoreDouble';
import type { ActivitySortBy } from './types';

// Right-side controls for an ActivityBucket: sort mode and a compact-summary toggle.
const styles = defineStyles('BucketControls', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: 12,
    color: theme.palette.greyAlpha(0.55),
  },
  sortLabel: {
    color: theme.palette.greyAlpha(0.45),
  },
  toggle: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    color: theme.palette.greyAlpha(0.45),
    '&:hover': {
      color: theme.palette.greyAlpha(0.85),
    },
  },
  toggleActive: {
    color: theme.palette.primary.main,
    '&:hover': {
      color: theme.palette.primary.main,
    },
  },
  toggleIcon: {
    fontSize: 16,
  },
}));

const SORT_OPTIONS: Array<Option & {value: ActivitySortBy}> = [
  { value: 'top', label: 'Top' },
  { value: 'new', label: 'New' },
  { value: 'old', label: 'Old' },
];

interface BucketControlsProps {
  sortBy: ActivitySortBy;
  onSortChange: (sortBy: ActivitySortBy) => void;
  compact: boolean;
  onToggleCompact: () => void;
}

const BucketControls = ({sortBy, onSortChange, compact, onToggleCompact}: BucketControlsProps) => {
  const classes = useStyles(styles);
  const selected = SORT_OPTIONS.find(o => o.value === sortBy) ?? SORT_OPTIONS[0];
  const handleSelect = (opt: Option) => onSortChange(opt.value as ActivitySortBy);
  const ToggleIcon = compact ? UnfoldMoreDoubleIcon : UnfoldLessIcon;
  const toggleTitle = compact ? 'Show summaries' : 'Hide summaries';
  return (
    <div className={classes.root}>
      <InlineSelect options={SORT_OPTIONS} selected={selected} handleSelect={handleSelect} />
      <button
        type="button"
        className={classNames(classes.toggle, compact && classes.toggleActive)}
        onClick={onToggleCompact}
        aria-pressed={compact}
        title={toggleTitle}
      >
        <ToggleIcon className={classes.toggleIcon} />
      </button>
    </div>
  );
};

export default BucketControls;
