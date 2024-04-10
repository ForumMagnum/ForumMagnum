import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import classNames from 'classnames'
import Checkbox from '@material-ui/core/Checkbox';
import { QueryLink } from '../../lib/reactRouterWrapper'
import * as _ from 'underscore';
import Tooltip from '@material-ui/core/Tooltip';
import { useCurrentUser } from '../common/withUser';
import { DEFAULT_LOW_KARMA_THRESHOLD, MAX_LOW_KARMA_THRESHOLD } from '../../lib/collections/posts/views'

import { timeframes as defaultTimeframes } from './AllPostsPage'

import { SORT_ORDER_OPTIONS, SettingsOption } from '../../lib/collections/posts/dropdownOptions';
import { isEAForum } from '../../lib/instanceSettings';
import { isFriendlyUI, preferredHeadingCase } from '../../themes/forumTheme';
import { ForumOptions, forumSelect } from '../../lib/forumTypeUtils';

type Filters = 'all'|'questions'|'meta'|'frontpage'|'curated'|'events';

const FILTERS_ALL: ForumOptions<Partial<Record<Filters, SettingsOption>>> = {
  "AlignmentForum": {
    all: {
      label: "All Posts",
      tooltip: "Includes all posts"
    },
    questions: {
      label: "Questions",
      tooltip: "Open questions and answers, ranging from newbie-questions to important unsolved scientific problems."
    }
  },
  "LessWrong": {
    all: {
      label: "All Posts",
      tooltip: "Includes personal blogposts as well as frontpage, curated, questions, events and meta posts."
    },
    frontpage: {
      label: "Frontpage",
      tooltip: "Moderators add posts to the frontpage if they meet certain criteria: aiming to explain, rather than persuade, and avoiding identity politics."
    },
    curated: {
      label: "Curated",
      tooltip: "Posts chosen by the moderation team to be well written and important (approximately 3 per week)"
    },
    questions: {
      label: "Questions",
      tooltip: "Open questions and answers, ranging from newbie-questions to important unsolved scientific problems."
    },
    events: {
      label: "Events",
      tooltip: "Events from around the world."
    }
  },
  "EAForum": {
    all: {
      label: "All posts",
      tooltip: "Includes personal blogposts as well as frontpage, questions, and community posts."
    },
    frontpage: {
      label: "Frontpage",
      tooltip: "Posts about research and other work in high-impact cause areas."
    },
    curated: {
      label: "Curated",
      tooltip: "Posts chosen by the moderation team to be well written and important (approximately 3 per week)"
    },
    questions: {
      label: "Questions",
      tooltip: "Open questions and answers, ranging from newcomer questions to important unsolved scientific problems."
    },
    events: {
      label: "Events",
      tooltip: "Events from around the world."
    },
  },
  "default": {
    all: {
      label: "All Posts",
      tooltip: "Includes personal blogposts as well as frontpage, questions, and community posts."
    },
    frontpage: {
      label: "Frontpage",
      tooltip: "Posts about research and other work in high-impact cause areas."
    },
    questions: {
      label: "Questions",
      tooltip: "Open questions and answers, ranging from newcomer questions to important unsolved scientific problems."
    },
    events: {
      label: "Events",
      tooltip: "Events from around the world."
    },
  }
}

const FILTERS = forumSelect(FILTERS_ALL)

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginTop: isFriendlyUI ? 10 : undefined,
    marginBottom: theme.spacing.unit,
    flexWrap: "wrap",
    background: theme.palette.panelBackground.default,
    padding: isFriendlyUI ? "16px 24px 16px 24px" : "12px 24px 8px 12px",
    borderRadius: theme.borderRadius.default,
    [theme.breakpoints.down('xs')]: {
      flexDirection: "column",
      flexWrap: "nowrap",
    },
  },
  hidden: {
    display: "none", // Uses CSS to show/hide
    overflow: "hidden",
  },
  checkbox: {
    padding: "1px 12px 0 0",
    paddingRight: isFriendlyUI ? 6 : undefined,
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
})

const USER_SETTING_NAMES = {
  timeframe: 'allPostsTimeframe',
  sortedBy: 'allPostsSorting',
  filter: 'allPostsFilter',
  showLowKarma: 'allPostsShowLowKarma',
  showEvents: 'allPostsIncludeEvents',
  hideCommunity: 'allPostsHideCommunity'
}

const PostsListSettings = ({persistentSettings, hidden, currentTimeframe, currentSorting, currentFilter, currentShowLowKarma, currentIncludeEvents, currentHideCommunity = false, timeframes=defaultTimeframes, sortings=SORT_ORDER_OPTIONS, showTimeframe, classes}: {
  persistentSettings?: any,
  hidden: boolean,
  currentTimeframe?: any,
  currentSorting: PostSortingMode,
  currentFilter: any,
  currentShowLowKarma: boolean,
  currentIncludeEvents: boolean,
  currentHideCommunity?: boolean,
  timeframes?: any,
  sortings?: { [key: string]: SettingsOption; },
  showTimeframe?: boolean,
  classes: ClassesType,
}) => {
  const { MetaInfo, SettingsColumn } = Components
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();

  const setSetting = (type: keyof typeof USER_SETTING_NAMES, newSetting: any) => {
    if (currentUser && persistentSettings) {
      void updateCurrentUser({
        [USER_SETTING_NAMES[type]]: newSetting,
      })
    }
  }

  return (
      <div className={classNames(classes.root, {[classes.hidden]: hidden})}>
        {showTimeframe && <SettingsColumn
          type={'timeframe'}
          title={'Timeframe:'}
          options={timeframes}
          currentOption={currentTimeframe}
          setSetting={setSetting}
          nofollow
        />}

        <SettingsColumn
          type={'sortedBy'}
          title={'Sorted by:'}
          options={sortings}
          currentOption={currentSorting}
          setSetting={setSetting}
          nofollow
        />

        <SettingsColumn
          type={'filter'}
          title={'Filtered by:'}
          options={FILTERS}
          currentOption={currentFilter}
          setSetting={setSetting}
          nofollow
        />

        <div>
          <Tooltip title={<div><div>By default, posts below -10 karma are hidden.</div><div>Toggle to show them.</div></div>} placement="left-start">
            <QueryLink
              className={classes.checkboxGroup}
              onClick={() => setSetting('showLowKarma', !currentShowLowKarma)}
              query={{karmaThreshold: (currentShowLowKarma ? DEFAULT_LOW_KARMA_THRESHOLD : MAX_LOW_KARMA_THRESHOLD)}}
              merge
              rel="nofollow"
            >
              <Checkbox classes={{root: classes.checkbox, checked: classes.checkboxChecked}} checked={currentShowLowKarma} />

              <MetaInfo className={classes.checkboxLabel}>
                {preferredHeadingCase("Show Low Karma")}
              </MetaInfo>
            </QueryLink>
          </Tooltip>

          <Tooltip title={<div><div>By default, events are hidden.</div><div>Toggle to show them.</div></div>} placement="left-start">
            <QueryLink
              className={classes.checkboxGroup}
              onClick={() => setSetting('showEvents', !currentIncludeEvents)}
              query={{includeEvents: !currentIncludeEvents}}
              merge
              rel="nofollow"
            >
              <Checkbox classes={{root: classes.checkbox, checked: classes.checkboxChecked}} checked={currentIncludeEvents}/>

              <MetaInfo className={classes.checkboxLabel}>
                {preferredHeadingCase("Show Events")}
              </MetaInfo>
            </QueryLink>
          </Tooltip>

          {isEAForum && <Tooltip title={<div><div>By default, Community posts are shown.</div><div>Toggle to hide them.</div></div>} placement="left-start">
            <QueryLink
              className={classes.checkboxGroup}
              onClick={() => setSetting('hideCommunity', !currentHideCommunity)}
              query={{hideCommunity: !currentHideCommunity}}
              merge
              rel="nofollow"
            >
              <Checkbox classes={{root: classes.checkbox, checked: classes.checkboxChecked}} checked={!currentHideCommunity}/>
              <MetaInfo className={classes.checkboxLabel}>
                Show community
              </MetaInfo>
            </QueryLink>
          </Tooltip>}
        </div>
      </div>
  );
};

const PostsListSettingsComponent = registerComponent(
  'PostsListSettings', PostsListSettings, { styles }
);

declare global {
  interface ComponentTypes {
    PostsListSettings: typeof PostsListSettingsComponent
  }
}
