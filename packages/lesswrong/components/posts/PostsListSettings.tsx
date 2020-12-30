import { Components, registerComponent } from '../../lib/vulcan-lib';
import { withUpdateCurrentUser, WithUpdateCurrentUserProps } from '../hooks/useUpdateCurrentUser';
import React, { Component } from 'react';
import classNames from 'classnames'
import Checkbox from '@material-ui/core/Checkbox';
import { QueryLink } from '../../lib/reactRouterWrapper'
import * as _ from 'underscore';
import Tooltip from '@material-ui/core/Tooltip';
import withUser from '../common/withUser';
import { DEFAULT_LOW_KARMA_THRESHOLD, MAX_LOW_KARMA_THRESHOLD } from '../../lib/collections/posts/views'

import { sortings as defaultSortings, timeframes as defaultTimeframs } from './AllPostsPage'
import { forumTypeSetting } from '../../lib/instanceSettings';

const FILTERS_ALL = {
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
  }
}
const FILTERS = FILTERS_ALL[forumTypeSetting.get()]

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
}

interface ExternalProps {
  persistentSettings?: any,
  hidden: boolean,
  currentTimeframe?: any,
  currentSorting: any,
  currentFilter: any,
  currentShowLowKarma: boolean,
  timeframes?: any,
  sortings?: any,
  showTimeframe?: boolean,
}
interface PostsListSettingsProps extends ExternalProps, WithUserProps, WithUpdateCurrentUserProps, WithStylesProps {
}

class PostsListSettings extends Component<PostsListSettingsProps> {

  setSetting = (type, newSetting) => {
    const { updateCurrentUser, currentUser, persistentSettings } = this.props
    if (currentUser && persistentSettings) {
      void updateCurrentUser({
        [USER_SETTING_NAMES[type]]: newSetting,
      })
    }
  }

  render () {
    const {
      classes, hidden, currentTimeframe, currentSorting, currentFilter, currentShowLowKarma,
      timeframes = defaultTimeframs, sortings = defaultSortings, showTimeframe
    } = this.props
    const { MetaInfo } = Components

    return (
      <div className={classNames(classes.root, {[classes.hidden]: hidden})}>
        {showTimeframe && <SettingsColumn
          type={'timeframe'}
          title={'Timeframe:'}
          options={timeframes}
          currentOption={currentTimeframe}
          setSetting={this.setSetting}
          classes={classes}
        />}

        <SettingsColumn
          type={'sortedBy'}
          title={'Sorted by:'}
          options={sortings}
          currentOption={currentSorting}
          setSetting={this.setSetting}
          classes={classes}
        />

        <SettingsColumn
          type={'filter'}
          title={'Filtered by:'}
          options={FILTERS}
          currentOption={currentFilter}
          setSetting={this.setSetting}
          classes={classes}
        />

        <Tooltip title={<div><div>By default, posts below -10 karma are hidden.</div><div>Toggle to show them.</div></div>}>
          <QueryLink
            className={classes.checkboxGroup}
            onClick={() => this.setSetting('showLowKarma', !currentShowLowKarma)}
            query={{karmaThreshold: (currentShowLowKarma ? DEFAULT_LOW_KARMA_THRESHOLD : MAX_LOW_KARMA_THRESHOLD)}}
            merge
          >
            <Checkbox classes={{root: classes.checkbox, checked: classes.checkboxChecked}} checked={currentShowLowKarma} />

            <MetaInfo className={classes.checkboxLabel}>
              Show Low Karma
            </MetaInfo>
          </QueryLink>
        </Tooltip>
      </div>
    );
  }
};

const PostsListSettingsComponent = registerComponent<ExternalProps>(
  'PostsListSettings', PostsListSettings, {
    styles,
    hocs: [
      withUser,
      withUpdateCurrentUser
    ]
  }
);

declare global {
  interface ComponentTypes {
    PostsListSettings: typeof PostsListSettingsComponent
  }
}
