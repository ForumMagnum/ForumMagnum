import { Components, registerComponent, withUpdate, getSetting } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames'
import { withStyles } from '@material-ui/core/styles';
import Checkbox from '@material-ui/core/Checkbox';
import Tooltip from '@material-ui/core/Tooltip';
import Users from 'meteor/vulcan:users';
import { QueryLink } from '../../lib/reactRouterWrapper.js'

import withUser from '../common/withUser';
import { DEFAULT_LOW_KARMA_THRESHOLD, MAX_LOW_KARMA_THRESHOLD } from '../../lib/collections/posts/views'

import { sortings as defaultSortings } from './AllPostsPage.jsx'

const FILTERS_ALL = {
  "AlignmentForum": [
    {
      name: "all",
      label: "All Posts",
      tooltip: "Includes all posts"},
    {
      name: "questions",
      label: "Questions",
      tooltip: "Open questions and answers, ranging from newbie-questions to important unsolved scientific problems."},
    {
      name: "meta",
      label: "Meta",
      tooltip: "Posts relating to LessWrong itself"
    },
  ],
  "LessWrong": [
    { name: "all",
      label: "All Posts",
      tooltip: "Includes personal blogposts as well as frontpage, curated, questions, events and meta posts."},
    { name: "frontpage",
      label: "Frontpage",
      tooltip: "Moderators add posts to the frontpage if they meet certain criteria: aiming to explain, rather than persuade, and avoiding identity politics."},
    { name: "curated",
      label: "Curated",
      tooltip: "Posts chosen by the moderation team to be well written and important (approximately 3 per week)"},
    { name: "questions",
      label: "Questions",
      tooltip: "Open questions and answers, ranging from newbie-questions to important unsolved scientific problems."},
    { name: "events",
      label: "Events",
      tooltip: "Events from around the world."
    },
    { name: "meta",
      label: "Meta",
      tooltip: "Posts relating to LessWrong itself"
    },
  ],
  "EAForum": [
    { name: "all",
      label: "All Posts",
      tooltip: "Includes personal blogposts as well as frontpage, questions, and community posts."},
    { name: "frontpage",
      label: "Frontpage",
      tooltip: "Moderators add posts to the frontpage if they meet certain criteria: aiming to explain, not persuade, and staying on topic."},
    { name: "questions",
      label: "Questions",
      tooltip: "Open questions and answers, ranging from newbie-questions to important unsolved scientific problems."},
    { name: "meta",
      label: "Community",
      tooltip: "Posts with topical content or relating to the EA community itself"
    },
  ]
}
const FILTERS = FILTERS_ALL[getSetting('forumType')]

const styles = theme => ({
  root: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    borderBottom:"solid 2px rgba(0,0,0,.6)",
    marginBottom: theme.spacing.unit,
    paddingLeft: theme.spacing.unit*5,
    paddingRight: theme.spacing.unit*4,
    paddingTop: theme.spacing.unit/2,
    paddingBottom: theme.spacing.unit*2,
    flexWrap: "wrap",
    marginLeft: 3,
    [theme.breakpoints.down('md')]: {
      paddingLeft: theme.spacing.unit*2,
      paddingRight: theme.spacing.unit*2,
    }
  },
  hidden: {
    display: "none", // Uses CSS to show/hide
    overflow: "hidden",
  },
  menuItem: {
    display: "block",
    cursor: "pointer",
    color: theme.palette.grey[500],
    marginLeft: theme.spacing.unit*1.5,
    whiteSpace: "nowrap",
    '&:hover': {
      color: theme.palette.grey[600],
    },
  },
  selectionList: {
    marginRight: theme.spacing.unit*2,
    [theme.breakpoints.down('xs')]: {
      flex: `1 0 calc(50% - ${theme.spacing.unit*4}px)`,
      order: 1
    }
  },
  selectionTitle: {
    display: "block",
    fontStyle: "italic",
    marginBottom: theme.spacing.unit/2
  },
  selected: {
    color: theme.palette.grey[900],
    '&:hover': {
      color: theme.palette.grey[900],
    },
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

class PostsListSettings extends Component {

  setFilter = (filter) => {
    const { updateUser, currentUser, persistentSettings } = this.props
    if (currentUser && persistentSettings) {
      updateUser({
        selector: { _id: currentUser._id},
        data: {
          allPostsFilter: filter,
        },
      })
    }
  }

  setSortedBy = (sortedBy) => {
    const { updateUser, currentUser, persistentSettings } = this.props
    if (currentUser && persistentSettings) {
      updateUser({
        selector: { _id: currentUser._id},
        data: {
          allPostsSorting: sortedBy,
        },
      })
    }
  }

  setShowLowKarma = (newSetting) => {
    const { updateUser, currentUser, persistentSettings } = this.props
    if (currentUser && persistentSettings) {
      updateUser({
        selector: { _id: currentUser._id},
        data: {
          allPostsShowLowKarma: newSetting,
        },
      })
    }
  }


  render () {
    const { classes, hidden, currentSorting, currentFilter, currentShowLowKarma, sortings = defaultSortings } = this.props
    const { MetaInfo } = Components

    return (
      <div className={classNames(classes.root, {[classes.hidden]: hidden})}>
        <div className={classes.selectionList}>
          <MetaInfo className={classes.selectionTitle}>
            Sorted by:
          </MetaInfo>
          {Object.entries(sortings).map(([name, label]) => {
            return (
              <QueryLink
                key={name}
                onClick={() => this.setSortedBy(name)}
                query={{sortedBy: name}}
                merge
              >
                <MetaInfo className={classNames(classes.menuItem, {[classes.selected]: currentSorting === name})}>
                  { label }
                </MetaInfo>
              </QueryLink>
            )
          })}
        </div>

        <div className={classes.selectionList}>
          <MetaInfo className={classes.selectionTitle}>
            Filtered by:
          </MetaInfo>
          {FILTERS.map(filter => {
            return (
              <QueryLink
                key={filter.name}
                onClick={() => this.setFilter(filter.name)}
                query={{filter: filter.name}}
                merge
              >
                <MetaInfo className={classNames(classes.menuItem, {[classes.selected]: currentFilter === filter.name})}>
                  <Tooltip title={<div>{filter['tooltip']}</div>} placement="left-start">
                    <span>{ filter.label }</span>
                  </Tooltip>
                </MetaInfo>
              </QueryLink>
            )
          })}
        </div>

        <Tooltip title={<div><div>By default, posts below -10 karma are hidden.</div><div>Toggle to show them.</div></div>} placement="right-start">
          <QueryLink
            className={classes.checkboxGroup}
            onClick={() => this.setShowLowKarma(!currentShowLowKarma)}
            query={{karmaThreshold: (currentShowLowKarma ? DEFAULT_LOW_KARMA_THRESHOLD : MAX_LOW_KARMA_THRESHOLD)}}
            merge
          >
            <Checkbox classes={{root: classes.checkbox, checked: classes.checkboxChecked}} checked={currentShowLowKarma} />

            {/* {currentShowLowKarma ?
            // Looks like Checkbox doesn't play nicely with the Link/route based check-status-setting/
            // This works fine but feels a bit hacky
              <Checkbox classes={{root: classes.checkbox, checked: classes.checkboxChecked}} checked />
              :
              <Checkbox classes={{root: classes.checkbox, checked: classes.checkboxChecked}}/>
            } */}

            <MetaInfo className={classes.checkboxLabel}>
              Show Low Karma
            </MetaInfo>
          </QueryLink>
        </Tooltip>
      </div>
    );
  }
}

PostsListSettings.propTypes = {
  currentUser: PropTypes.object,
};

PostsListSettings.displayName = 'PostsListSettings';

const withUpdateOptions = {
  collection: Users,
  fragmentName: 'UsersCurrent',
}

registerComponent('PostsListSettings', PostsListSettings, withUser, withStyles(styles, {name:"PostsListSettings"}), [withUpdate, withUpdateOptions]);
