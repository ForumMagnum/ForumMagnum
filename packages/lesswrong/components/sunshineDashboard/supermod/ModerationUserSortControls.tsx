import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import {
  sortDirections,
  userSortKeys,
  USER_SORT_DIRECTION_LABELS,
  USER_SORT_KEY_LABELS,
  type UserSort,
  type UserSortSpec,
} from './userSort';

const NO_SORT = 'none';

const styles = defineStyles('ModerationUserSortControls', (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    padding: '8px 16px',
    borderBottom: theme.palette.border.normal,
    fontSize: 13,
    color: theme.palette.grey[700],
  },
  select: {
    padding: '4px 6px',
    fontSize: 13,
    fontFamily: 'inherit',
    border: theme.palette.border.normal,
    borderRadius: 4,
    backgroundColor: theme.palette.background.default,
    color: theme.palette.text.normal,
  },
}));

// `allowNone` adds a "Nothing" option, which reports `null`
const SortSpecSelects = ({ spec, onChange, allowNone }: {
  spec: UserSortSpec | null;
  onChange: (spec: UserSortSpec | null) => void;
  allowNone?: boolean;
}) => {
  const classes = useStyles(styles);
  return <>
    <select
      className={classes.select}
      value={spec?.key ?? NO_SORT}
      onChange={(event) => {
        const key = event.target.value;
        if (userSortKeys.has(key)) {
          onChange({ key, direction: spec?.direction ?? 'asc' });
        } else if (allowNone) {
          onChange(null);
        }
      }}
    >
      {allowNone && <option value={NO_SORT}>Nothing</option>}
      {[...userSortKeys].map(key => <option key={key} value={key}>{USER_SORT_KEY_LABELS[key]}</option>)}
    </select>
    {spec && (
      <select
        className={classes.select}
        value={spec.direction}
        onChange={(event) => {
          const direction = event.target.value;
          if (sortDirections.has(direction)) {
            onChange({ ...spec, direction });
          }
        }}
      >
        {[...sortDirections].map(direction => (
          <option key={direction} value={direction}>{USER_SORT_DIRECTION_LABELS[spec.key][direction]}</option>
        ))}
      </select>
    )}
  </>;
};

const ModerationUserSortControls = ({ sort, onChange }: {
  sort: UserSort;
  onChange: (sort: UserSort) => void;
}) => {
  const classes = useStyles(styles);
  return (
    <div className={classes.root}>
      Sort by
      <SortSpecSelects
        spec={sort.primary}
        onChange={(primary) => primary && onChange({ ...sort, primary })}
      />
      then by
      <SortSpecSelects
        spec={sort.secondary}
        onChange={(secondary) => onChange({ ...sort, secondary })}
        allowNone
      />
    </div>
  );
};

export default ModerationUserSortControls;
