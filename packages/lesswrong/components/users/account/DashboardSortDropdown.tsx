import React from 'react';
import classNames from 'classnames';
import { TupleSet, UnionOf } from '@/lib/utils/typeGuardUtils';
import type { SettingsOption } from '@/lib/collections/posts/dropdownOptions';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ForumDropdown from '../../common/ForumDropdown';

/**
 * Sort modes offered by the dashboard's Posts and Comments tabs. These strings are
 * valid for both `PostsViewTerms.sortedBy` and the `profileComments` view's `sortBy`.
 */
export const DASHBOARD_SORT_MODES = new TupleSet(['new', 'top', 'old'] as const);

export type DashboardSortMode = UnionOf<typeof DASHBOARD_SORT_MODES>;

export const dashboardSortOptions = {
  new: { label: 'Most recent' },
  top: { label: 'Highest karma' },
  old: { label: 'Oldest' },
} satisfies Record<DashboardSortMode, SettingsOption>;

export function parseDashboardSortMode(queryValue: string | undefined): DashboardSortMode {
  return queryValue !== undefined && DASHBOARD_SORT_MODES.has(queryValue) ? queryValue : 'new';
}

const styles = defineStyles('DashboardSortDropdown', (theme: ThemeType) => ({
  root: {
    '& button': {
      color: theme.palette.grey[600],
      fontFamily: theme.typography.fontFamily,
      fontSize: 13,
      minHeight: 'unset',
      paddingLeft: 0,
      '&:hover': {
        color: theme.palette.grey[900],
      },
    },
  },
}));

const DashboardSortDropdown = ({value, queryParam, className}: {
  value: DashboardSortMode,
  queryParam: string,
  className?: string,
}) => {
  const classes = useStyles(styles);
  return <ForumDropdown
    value={value}
    options={dashboardSortOptions}
    queryParam={queryParam}
    className={classNames(classes.root, className)}
  />;
};

export default DashboardSortDropdown;
