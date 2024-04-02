import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useNavigate } from '../../lib/reactRouterWrapper';
import { useLocation } from '../../lib/routeUtil';
import type { Option } from '../common/InlineSelect';

import qs from 'qs';
import { TupleSet, UnionOf } from '../../lib/utils/typeGuardUtils';
import classNames from 'classnames';

const styles = (theme: ThemeType) => ({
  displaySettings: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'end',
    height: 40
  },
  filterRow: {
    display: "flex",
    justifyContent: "flex-start",
    paddingBottom: 2,
    paddingLeft: 2,
    paddingRight: 2
  },
  filterButton: {
    marginRight: 16,
    color: theme.palette.grey[500],
    ...theme.typography.smallText,
    display: "inline-block",
    cursor: "pointer",
    userSelect: "none",
  },
  selected: {
    color: theme.palette.text.maxIntensity,
    backgroundColor: theme.palette.panelBackground.hoverHighlightGrey,
    padding: 4,
    paddingLeft: 8,
    paddingRight: 8,
    marginTop: -4,
    marginBottom: -4,
    borderRadius: 2,
  },
});

const SORT_ORDER_SET = new TupleSet(['curated', 'year'] as const);

export type LWReviewWinnerSortOrder = UnionOf<typeof SORT_ORDER_SET>;

interface DisplaySettings {
  currentSortOrder: LWReviewWinnerSortOrder;
}

const REVIEW_WINNER_SORT_ORDERS: Record<LWReviewWinnerSortOrder, string> = {
  curated: `moderator's pick across all years`,
  year: 'review year descending, followed by ranking within year'
};

const SORT_QUERY_PARAM = 'sort';
const DEFAULT_SORT_ORDER: LWReviewWinnerSortOrder = 'curated';

export function getCurrentTopPostDisplaySettings(query: Record<string, string>): DisplaySettings {
  const querySortOrder = query?.[SORT_QUERY_PARAM];
  const currentSortOrder = SORT_ORDER_SET.has(querySortOrder) ? querySortOrder : DEFAULT_SORT_ORDER;

  return { currentSortOrder };
}

export const TopPostsDisplaySettings = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { query } = location;

  const { MetaInfo, LWTooltip } = Components;

  const { currentSortOrder } = getCurrentTopPostDisplaySettings(query);

  const handleSortOptionClick = (opt: Option & { value: LWReviewWinnerSortOrder }) => {
    const newSortOrder = opt.value;
    const newQuery = { ...query, [SORT_QUERY_PARAM]: newSortOrder };
    navigate({ ...location.location, search: `?${qs.stringify(newQuery)}` });
  };

  const sortOptions = Object.entries(REVIEW_WINNER_SORT_ORDERS).map(([key, value]: [LWReviewWinnerSortOrder, string]) => ({ label: value, value: key }));

  return (
    <span className={classes.displaySettings}>
      <MetaInfo>
        Sort by: 
      </MetaInfo>
      <div className={classes.filterRow}>
        {sortOptions.map(sortOption => (
          <LWTooltip key={sortOption.value} title={sortOption.label}>
            <span className={classNames(classes.filterButton, {[classes.selected]: currentSortOrder===sortOption.value})} onClick={ev => handleSortOptionClick(sortOption)}>
              {sortOption.value}
            </span>
          </LWTooltip>
        ))}
      </div>
    </span>
  );
}

const TopPostsDisplaySettingsComponent = registerComponent('TopPostsDisplaySettings', TopPostsDisplaySettings, {styles});

declare global {
  interface ComponentTypes {
    TopPostsDisplaySettings: typeof TopPostsDisplaySettingsComponent
  }
}
