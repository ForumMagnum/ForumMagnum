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

import { sortings as defaultSortings, timeframes as defaultTimeframes } from './AllPostsPage'
import { ForumOptions, forumSelect } from '../../lib/forumTypeUtils';

type Filters = 'all'|'questions'|'meta'|'frontpage'|'curated'|'events';

const FILTERS_ALL: ForumOptions<Partial<Record<Filters, {label: string, tooltip: string}>>> = {
  "AlignmentForum": {
    all: {
      label: "All Posts",
      tooltip: "Includes all posts"
    },
    questions: {
      label: "Questions",
      tooltip: "Open questions and answers, ranging from newbie-questions to important unsolved scientific problems."
    },
    meta: {
      label: "Meta",
      tooltip: "Posts relating to LessWrong itself"
    },
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
    },
    meta: {
      label: "Meta",
      tooltip: "Posts relating to LessWrong itself"
    },
  },
  "EAForum": {
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
    marginBottom: theme.spacing.unit,
    flexWrap: "wrap",
    background: "white",
    padding: "12px 24px 8px 12px"
  },
  hidden: {
    display: "none", // Uses CSS to show/hide
    overflow: "hidden",
  },
  menuItem: {
    '&&': {
      // Increase specifity to remove import-order conflict with MetaInfo
      display: "block",
      cursor: "pointer",
      color: theme.palette.grey[500],
      marginLeft: theme.spacing.unit*1.5,
      whiteSpace: "nowrap",
      '&:hover': {
        color: theme.palette.grey[600],
      },
    },
  },
  selectionList: {
    marginRight: theme.spacing.unit*2,
    [theme.breakpoints.down('xs')]: {
      marginTop: theme.spacing.unit,
      flex: `1 0 calc(50% - ${theme.spacing.unit*4}px)`,
      order: 1
    }
  },
  selectionTitle: {
    '&&': {
      // Increase specifity to remove import-order conflict with MetaInfo
      display: "block",
      fontStyle: "italic",
      marginBottom: theme.spacing.unit/2
    },
  },
  selected: {
    // Increase specifity to remove import-order conflict with MetaInfo
    '&&': {
      color: theme.palette.grey[900],
      '&:hover': {
        color: theme.palette.grey[900],
      },
    }
  },
  checkbox: {
    padding: "1px 12px 0 0"
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

const SettingsColumn = ({type, title, options, currentOption, classes, setSetting}) => {
  const { MetaInfo } = Components

  return <div className={classes.selectionList}>
    <MetaInfo className={classes.selectionTitle}>
      {title}
    </MetaInfo>
    {Object.entries(options).map(([name, optionValue]: any) => {
      const label = _.isString(optionValue) ? optionValue : optionValue.label
      return (
        <QueryLink
          key={name}
          onClick={() => setSetting(type, name)}
          // TODO: Can the query have an ordering that matches the column ordering?
          query={{ [type]: name }}
          merge
          rel="nofollow"
        >
          <MetaInfo className={classNames(classes.menuItem, {[classes.selected]: currentOption === name})}>
            {optionValue.tooltip ?
              <Tooltip title={<div>{optionValue.tooltip}</div>} placement="left-start">
                <span>{ label }</span>
              </Tooltip> :
              <span>{ label }</span>
            }
          </MetaInfo>
        </QueryLink>
      )
    })}
  </div>
}

const USER_SETTING_NAMES = {
  timeframe: 'allPostsTimeframe',
  sortedBy: 'allPostsSorting',
  filter: 'allPostsFilter',
  showLowKarma: 'allPostsShowLowKarma',
  showEvents: 'allPostsIncludeEvents'
}

const PostsListSettings = ({persistentSettings, hidden, currentTimeframe, currentSorting, currentFilter, currentShowLowKarma, currentIncludeEvents, timeframes=defaultTimeframes, sortings=defaultSortings, showTimeframe, classes}: {
  persistentSettings?: any,
  hidden: boolean,
  currentTimeframe?: any,
  currentSorting: any,
  currentFilter: any,
  currentShowLowKarma: boolean,
  currentIncludeEvents: boolean,
  timeframes?: any,
  sortings?: any,
  showTimeframe?: boolean,
  classes: ClassesType,
}) => {
  const { MetaInfo } = Components
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();

  const setSetting = (type, newSetting) => {
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
          classes={classes}
        />}

        <SettingsColumn
          type={'sortedBy'}
          title={'Sorted by:'}
          options={sortings}
          currentOption={currentSorting}
          setSetting={setSetting}
          classes={classes}
        />

        <SettingsColumn
          type={'filter'}
          title={'Filtered by:'}
          options={FILTERS}
          currentOption={currentFilter}
          setSetting={setSetting}
          classes={classes}
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
                Show Low Karma
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
                Show Events
              </MetaInfo>
            </QueryLink>
          </Tooltip>
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
