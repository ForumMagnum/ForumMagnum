import { Components, registerComponent, withUpdate, getSetting } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames'
import { withStyles } from '@material-ui/core/styles';
import Checkbox from '@material-ui/core/Checkbox';
import Tooltip from '@material-ui/core/Tooltip';
import Users from 'meteor/vulcan:users';
import { Link } from '../../lib/reactRouterWrapper.js'

import withUser from '../common/withUser';
import { DEFAULT_LOW_KARMA_THRESHOLD, MAX_LOW_KARMA_THRESHOLD } from '../../lib/collections/posts/views'

import { views as defaultViews } from './AllPostsPage.jsx'

const FILTERS_ALL = {
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
  // TODO; submit edits to LW?
  // Really the important thing is that they're not edited when lw does
  "EAForum": [
    { name: "all",
      label: "All Posts",
      tooltip: "Includes personal blogposts as well as frontpage, questions, and community posts."},
    { name: "frontpage",
      label: "Frontpage",
      tooltip: "Material selected by moderators as especially interesting or useful to people with interest in doing good effectively."},
    { name: "questions",
      label: "Questions",
      tooltip: "Open questions and answers, ranging from newcomer questions to important unsolved scientific problems."},
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

  setView = (view) => {
    const { updateUser, currentUser, persistentSettings } = this.props
    if (currentUser && persistentSettings) {
      updateUser({
        selector: { _id: currentUser._id},
        data: {
          allPostsView: view,
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
    const { classes, hidden, currentView, currentFilter, currentShowLowKarma, views = defaultViews } = this.props
    const { MetaInfo } = Components

    return (
      <div className={classNames(classes.root, {[classes.hidden]: hidden})}>
        <div className={classes.selectionList}>
          <MetaInfo className={classes.selectionTitle}>
            Sorted by:
          </MetaInfo>
          {Object.entries(views).map(([name, label]) => {
            return (
              <Link 
                key={name} 
                onClick={() => this.setView(name)}
                to={loc=> ({...loc, query: {...loc.query, view: name}})}
              >
                <MetaInfo className={classNames(classes.menuItem, {[classes.selected]: currentView === name})}>
                  { label }
                </MetaInfo>
              </Link>
            )
          })}
        </div>

        <div className={classes.selectionList}>
          <MetaInfo className={classes.selectionTitle}>
            Filtered by:
          </MetaInfo>
          {FILTERS.map(filter => {
            return (
              <Link 
                key={filter.name} 
                onClick={() => this.setFilter(filter.name)}
                to={loc=> ({...loc, query: {...loc.query, filter: filter.name}})}
              >
                <MetaInfo className={classNames(classes.menuItem, {[classes.selected]: currentFilter === filter.name})}>
                  <Tooltip title={<div>{filter['tooltip']}</div>} placement="left-start">
                    <span>{ filter.label }</span>
                  </Tooltip>
                </MetaInfo>
              </Link>
            )
          })}
        </div>

        <Tooltip title={<div><div>By default, posts below -10 karma are hidden.</div><div>Toggle to show them.</div></div>} placement="right-start">
          <Link 
            className={classes.checkboxGroup}
            onClick={() => this.setShowLowKarma(!currentShowLowKarma)}
            to={loc=> ({...loc, query: {...loc.query, karmaThreshold: (currentShowLowKarma ? DEFAULT_LOW_KARMA_THRESHOLD : MAX_LOW_KARMA_THRESHOLD)}})}
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
          </Link>
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
