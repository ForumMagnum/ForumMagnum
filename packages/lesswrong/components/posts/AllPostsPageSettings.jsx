import { Components, registerComponent, withUpdate } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames'
import { withStyles } from '@material-ui/core/styles';
import Checkbox from '@material-ui/core/Checkbox';
import Tooltip from '@material-ui/core/Tooltip';
import Users from 'meteor/vulcan:users';
import { Link } from 'react-router'

import withUser from '../common/withUser';
import { DEFAULT_LOW_KARMA_THRESHOLD, MAX_LOW_KARMA_THRESHOLD } from '../../lib/collections/posts/views'


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
    marginRight: theme.spacing.unit*2,
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
  },
})

class AllPostsPageSettings extends Component {


  setFilter = (filter) => {
    const { updateUser, currentUser } = this.props
    if (currentUser) {
      updateUser({
        selector: { _id: currentUser._id},
        data: {
          allPostsFilter: filter,
        },
      })
    }
  }

  setView = (view) => {
    const { updateUser, currentUser } = this.props
    if (currentUser) {
      updateUser({
        selector: { _id: currentUser._id},
        data: {
          allPostsView: view,
        },
      })  
    }
  }

  setShowLowKarma = (newSetting) => {
    const { updateUser, currentUser } = this.props
    if (currentUser) {
      updateUser({
        selector: { _id: currentUser._id},
        data: {
          allPostsShowLowKarma: newSetting,
        },
      })  
    }
  }


  render () {
    const { classes, hidden, currentView, currentFilter, currentShowLowKarma } = this.props
    const { MetaInfo } = Components

    const views = [
      {name: 'daily', label: "Daily"},
      {name: 'magic', label: "Magic (New & Upvoted)"},
      {name: 'recentComments', label: "Recent Comments"},
      {name: 'new', label: "New"},
      {name: 'old', label: "Old"},
      {name: 'top', label: "Top"},
    ]

    const filters = [
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
    ]

    return (
      <div className={classNames(classes.root, {[classes.hidden]: hidden})}>
        <div className={classes.selectionList}>
          <MetaInfo className={classes.selectionTitle}>
            Sorted by:
          </MetaInfo>
          {views.map(view => {
            return (
              <Link 
                key={view['name']} 
                onClick={() => this.setView(view['name'])}
                to={loc=> ({...loc, query: {...loc.query, view: view['name']}})}
              >
                <MetaInfo className={classNames(classes.menuItem, {[classes.selected]: currentView === view['name']})}>
                  { view['label'] }
                </MetaInfo>
              </Link>
            )
          })}
        </div>

        <div className={classes.selectionList}>
          <MetaInfo className={classes.selectionTitle}>
            Filtered by:
          </MetaInfo>
          {filters.map(filter => {
            return (
              <Link 
                key={filter['name']} 
                onClick={() => this.setFilter(filter['name'])}
                to={loc=> ({...loc, query: {...loc.query, filter: filter['name']}})}
              >
                <MetaInfo className={classNames(classes.menuItem, {[classes.selected]: currentFilter === filter['name']})}>
                  <Tooltip title={<div>{filter['tooltip']}</div>} placement="left-start">
                    <span>{ filter['label'] }</span>
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

AllPostsPageSettings.propTypes = {
  currentUser: PropTypes.object,
  defaultView: PropTypes.string,
  showPostTypes: PropTypes.bool,
};

AllPostsPageSettings.defaultProps = {
  defaultView: 'daily',
  showPostTypes: true,
};

AllPostsPageSettings.contextTypes = {
  currentRoute: PropTypes.object,
};

AllPostsPageSettings.displayName = 'AllPostsPageSettings';

const withUpdateOptions = {
  collection: Users,
  fragmentName: 'UsersCurrent',
}

registerComponent('AllPostsPageSettings', AllPostsPageSettings, withUser, withStyles(styles, {name:"AllPostsPageSettings"}), [withUpdate, withUpdateOptions]);
