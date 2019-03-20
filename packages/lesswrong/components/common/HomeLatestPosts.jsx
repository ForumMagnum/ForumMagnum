import { Components, registerComponent, withUpdate } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import withUser from '../common/withUser';
import { withStyles } from '@material-ui/core/styles'
import Tooltip from '@material-ui/core/Tooltip';
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

  toggleFilter = () => {
    const { updateUser, currentUser, router } = this.props

    let query = _.clone(router.location.query) || {view: "magic"}
    const currentFilter = query.filter || (currentUser && currentUser.currentFrontpageFilter) || "frontpage";

    const newFilter = (currentFilter === "frontpage") ? "includeMetaAndPersonal" : "frontpage"
    if (currentUser) {
      updateUser({
        selector: { _id: currentUser._id},
        data: {
          currentFrontpageFilter: newFilter,
        },
      })
    }
    query.filter = newFilter
    const location = { pathname: router.location.pathname, query };
    router.replace(location);
  }

  render () {
    const { currentUser, classes, router } = this.props;
    const { SingleColumnSection, SectionTitle, PostsList2 } = Components

    const query = _.clone(router.location.query) || {}
    const currentFilter = query.filter || (currentUser && currentUser.currentFrontpageFilter) || "frontpage";
    const limit = parseInt(query.limit) || 10

    const recentPostsTerms = {
      ...query,
      view: "magic",
      filter: currentFilter,
      forum: true,
      limit:limit
    }

    const latestTitle = (
      <p>
        <p>Recent posts, sorted by a mix of 'new' and 'highly upvoted'.</p>
        <p>By default shows only frontpage posts, and can optionally include personal blogposts.</p>
        <p><em>Moderators promote posts to frontpage if they seem to be:</em>
          <ul>
            <li>Aiming to explain rather than persuade</li>
            <li>Relatively timeless (avoiding reference to current events or local social knowledge)</li>
            {/* TODO; fix better I guess */}
            <li>Reasonably relevant to the average reader</li>
          </ul>
        </p>
      </p>
    )

    return (
      <SingleColumnSection>
        <SectionTitle title={<Tooltip title={latestTitle} placement="left-start"><span>Latest Posts</span></Tooltip>}/>
        <PostsList2 terms={recentPostsTerms}>
          <Link to={"/allPosts"}>View All Posts</Link>
          <span className={classes.checkBoxGroup} onClick={this.toggleFilter}>
            <Checkbox disableRipple classes={{root: classes.checkbox, checked: classes.checkboxChecked}} checked={!(currentFilter === "frontpage")} />
            Include Personal Posts
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

registerComponent('HomeLatestPosts', HomeLatestPosts, withUser, withRouter, withStyles(styles, {name:"HomeLatestPosts"}), [withUpdate, withUpdateOptions]);
