import { Components, registerComponent, withUpdate } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import withUser from '../common/withUser';
import { withStyles } from '@material-ui/core/styles'
import Checkbox from '@material-ui/core/Checkbox';
import Users from 'meteor/vulcan:users';
import { withRouter, Link } from 'react-router';
const styles = theme => ({
  checkbox: {
    padding: "1px 8px 0 0",
    '& svg': {
      height: "1.3rem",
      width: "1.3rem",
      position: "relative",
      top: -2
    }
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

  toggleFilter = (filter) => {
    const { updateUser, currentUser, router, currentView } = this.props
    const newFilter = currentView === "community" ? "frontpage" : "community"

    if (currentUser) {
      const newFilter = (currentUser.currentFrontpageFilter === "community") ? "frontpage" : "community"
      updateUser({
        selector: { _id: currentUser._id},
        data: {
          currentFrontpageFilter: newFilter,
        },
      })
    }

    const query = { ...router.location.query, view: newFilter };
    const location = { pathname: router.location.pathname, query };
    router.replace(location);
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
          <span className={classes.checkBoxGroup} onClick={this.toggleFilter}>
            <Checkbox classes={{root: classes.checkbox, checked: classes.checkboxChecked}} checked={currentView === "community"} />
            Include Personal Blogposts
          </span>
          <Link to={"/allPosts"}>All Posts</Link>
        </PostsList2>
      </SingleColumnSection>
    )
  }
}

const withUpdateOptions = {
  collection: Users,
  fragmentName: 'UsersCurrent',
}

registerComponent('HomeLatestPosts', HomeLatestPosts, withUser, withRouter, withStyles(styles, {name:"HomeLatestPosts"}), [withUpdate, withUpdateOptions]);
