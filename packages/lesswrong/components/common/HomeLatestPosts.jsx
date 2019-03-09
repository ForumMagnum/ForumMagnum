import { Components, registerComponent, withUpdate } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import { Link } from 'react-router';
import withUser from '../common/withUser';
import { withStyles } from '@material-ui/core/styles'
import Checkbox from '@material-ui/core/Checkbox';
import Users from 'meteor/vulcan:users';

const styles = theme => ({
  checkbox: {
    padding: "1px 12px 0 0"
  },
  checkboxGroup: {
    display: "flex",
    color: theme.palette.grey[800],
    alignItems: "center",
    [theme.breakpoints.down('xs')]: {
      marginBottom: theme.spacing.unit*2,
      flex: `1 0 100%`,
      order: 0
    }
  },
})

class HomeLatestPosts extends PureComponent {

  setFilter = (filter) => {
    const { updateUser, currentUser } = this.props
    if (currentUser) {
      updateUser({
        selector: { _id: currentUser._id},
        data: {
          homeFilter: filter,
        },
      })
    }
  }

  render () {
    const { classes, query, currentView, limit } = this.props;
    const { SingleColumnSection, SectionTitle, PostsList2 } = Components
  
    const recentPostsTerms = {
      view: currentView,
      forum: true,
      ...query,
      limit:limit
    }
  
    return (
      <SingleColumnSection>
        <SectionTitle title="Latest Posts"/>
        <PostsList2 terms={recentPostsTerms}>
          <Link to={"/allPosts"}>All Posts</Link>
          <span className={classes.checkBoxGroup} onClick={this.toggleFilter}>
            <Checkbox classes={{root: classes.checkbox, checked: classes.checkboxChecked}} checked={query.view === "all"} />
            Include Personal Blogposts
          </span>
        </PostsList2>
      </SingleColumnSection>
    )
  }
}

const withUpdateOptions = {
  collection: Users,
  fragmentName: 'UsersCurrent',
}

registerComponent('HomeLatestPosts', HomeLatestPosts, withUser, withStyles(styles, {name:"HomeLatestPosts"}), [withUpdate, withUpdateOptions]);
