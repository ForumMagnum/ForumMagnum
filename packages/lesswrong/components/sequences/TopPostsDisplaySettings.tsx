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
});

const REVIEW_WINNER_SORT_ORDERS = {
  curated: `moderator's pick across all years`,
  ranking: 'review ranking descending',
  year: 'review year descending, followed by ranking within year'
};

// const REVIEW_WINNER_SORT_ORDERS = ['curated', 'ranking', 'year'] as const;

export type LWReviewWinnerSortOrder = keyof typeof REVIEW_WINNER_SORT_ORDERS;

const SORT_QUERY_PARAM = 'sort';
const HIDE_AI_QUERY_PARAM = 'hideAI';
const DEFAULT_SORT_ORDER: LWReviewWinnerSortOrder = 'curated';

interface DisplaySettings {
  currentSortOrder: LWReviewWinnerSortOrder;
  currentAIVisibility: boolean;
}

export function getCurrentTopPostDisplaySettings(query: Record<string, string>): DisplaySettings {
  const currentSortOrder = query?.[SORT_QUERY_PARAM] ?? DEFAULT_SORT_ORDER;
  const currentAIVisibility = query?.[HIDE_AI_QUERY_PARAM] === 'true';

  return {
    currentSortOrder,
    currentAIVisibility
  };
}

export const TopPostsDisplaySettings = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { query } = location;

  const { InlineSelect, MetaInfo } = Components;

  const {
    currentSortOrder,
    currentAIVisibility
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

  const sortOptions = Object.entries(REVIEW_WINNER_SORT_ORDERS).map(([key, value]) => ({ label: value, value: key }));
  const selectedOption = sortOptions.find((option) => option.value === currentSortOrder) ?? sortOptions[0];

  return (
    <span className={classes.displaySettings}>
      {/* <span className={classes.sortGroup}> */}
      <MetaInfo>
        Sort by <InlineSelect options={sortOptions} selected={selectedOption} handleSelect={handleSortOptionClick}/>
      </MetaInfo>
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
