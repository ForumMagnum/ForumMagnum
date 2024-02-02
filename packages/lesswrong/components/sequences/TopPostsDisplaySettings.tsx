// TODO: Import component in components.ts
import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useNavigate } from '../../lib/reactRouterWrapper';
import { useLocation } from '../../lib/routeUtil';
import type { Option } from '../common/InlineSelect';

import isEmpty from 'lodash/isEmpty';
import qs from 'qs';
import Checkbox from '@material-ui/core/Checkbox';
import { preferredHeadingCase } from '../../themes/forumTheme';
import { TupleSet, UnionOf } from '../../lib/utils/typeGuardUtils';
import classNames from 'classnames';

const styles = (theme: ThemeType) => ({
  root: {},
  displaySettings: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'end'
  },
  sortGroup: {

  },
  checkboxGroup: {
    display: "flex",
    alignItems: "center",
    [theme.breakpoints.down('xs')]: {
      marginBottom: theme.spacing.unit*2,
      flex: `1 0 100%`,
      order: 0
    }
  },
  checkboxLabel: {
    cursor: 'pointer'
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

const SORT_ORDER_SET = new TupleSet(['curated', 'ranking', 'year'] as const);

export type LWReviewWinnerSortOrder = UnionOf<typeof SORT_ORDER_SET>;

const REVIEW_WINNER_SORT_ORDERS: Record<LWReviewWinnerSortOrder, string> = {
  curated: `moderator's pick across all years`,
  ranking: 'review ranking descending',
  year: 'review year descending, followed by ranking within year'
};

const SORT_QUERY_PARAM = 'sort';
const HIDE_AI_QUERY_PARAM = 'hideAI';
const DEFAULT_SORT_ORDER: LWReviewWinnerSortOrder = 'curated';

interface DisplaySettings {
  currentSortOrder: LWReviewWinnerSortOrder;
  aiPostsHidden: boolean;
}

export function getCurrentTopPostDisplaySettings(query: Record<string, string>): DisplaySettings {
  const querySortOrder = query?.[SORT_QUERY_PARAM];
  const currentSortOrder = SORT_ORDER_SET.has(querySortOrder) ? querySortOrder : DEFAULT_SORT_ORDER;
  const aiPostsHidden = query?.[HIDE_AI_QUERY_PARAM] === 'true';

  return {
    currentSortOrder,
    aiPostsHidden
  };
}

export const TopPostsDisplaySettings = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { query } = location;

  const { InlineSelect, MetaInfo, LWTooltip } = Components;

  const {
    currentSortOrder,
    aiPostsHidden: currentAIVisibility
  } = getCurrentTopPostDisplaySettings(query);

  const handleSortOptionClick = (opt: Option & { value: LWReviewWinnerSortOrder }) => {
    const newSortOrder = opt.value;
    const newQuery = { ...query, [SORT_QUERY_PARAM]: newSortOrder };
    navigate({ ...location.location, search: `?${qs.stringify(newQuery)}` });
  };

  const handleHideAIOptionClick = () => {
    const newVisibility = `${!currentAIVisibility}`;
    const newQuery = { ...query, [HIDE_AI_QUERY_PARAM]: newVisibility };
    navigate({ ...location.location, search: `?${qs.stringify(newQuery)}` });
  }

  const sortOptions = Object.entries(REVIEW_WINNER_SORT_ORDERS).map(([key, value]: [LWReviewWinnerSortOrder, string]) => ({ label: value, value: key }));
  const selectedOption = sortOptions.find((option) => option.value === currentSortOrder) ?? sortOptions[0];

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
        {/* <LWTooltip title={filterModeToTooltip("Hidden")}>
          <span className={classNames(classes.filterButton, {[classes.selected]: mode==="Hidden"})} onClick={ev => setMode("Hidden")}>
            Hidden
          </span>
        </LWTooltip>
        <LWTooltip title={filterModeToTooltip(reducedVal)}>
          <span
            className={classNames(classes.filterButton, {[classes.selected]: [0.5, "Reduced"].includes(mode)})}
            onClick={ev => setMode(reducedVal)}
          >
            {reducedName}
          </span>
        </LWTooltip> */}
      </div>

      {/* <span className={classes.sortGroup}> */}
      {/* <MetaInfo>
        Sort by <InlineSelect options={sortOptions} selected={selectedOption} handleSelect={handleSortOptionClick}/>
      </MetaInfo> */}
      <span className={classes.checkboxGroup}>
        <Checkbox onClick={handleHideAIOptionClick} checked={currentAIVisibility} />
        <MetaInfo className={classes.checkboxLabel}>
          {preferredHeadingCase("Hide AI Posts")}
        </MetaInfo>
      </span>
    </span>
  );
}

const TopPostsDisplaySettingsComponent = registerComponent('TopPostsDisplaySettings', TopPostsDisplaySettings, {styles});

declare global {
  interface ComponentTypes {
    TopPostsDisplaySettings: typeof TopPostsDisplaySettingsComponent
  }
}
