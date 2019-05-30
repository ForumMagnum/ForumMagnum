import { Components, registerComponent, withUpdate } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import withUser from '../common/withUser';
import Tooltip from '@material-ui/core/Tooltip';
import Users from 'meteor/vulcan:users';
import { withRouter, Link } from '../../lib/reactRouterWrapper.js';

class HomeLatestPosts extends PureComponent {

  toggleFilter = () => {
    const { updateUser, currentUser, router } = this.props

    let query = _.clone(router.location.query) || {view: "magic"}
    const currentFilter = query.filter || (currentUser && currentUser.currentFrontpageFilter) || "frontpage";

    const newFilter = (currentFilter === "frontpage") ? "frontpageAndMeta" : "frontpage"
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
    const { currentUser, router } = this.props;
    const { SingleColumnSection, SectionTitle, PostsList2, SectionFooterCheckbox } = Components

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
      <div>
        <p>Recent posts, sorted by a mix of 'new' and 'highly upvoted'.</p>
        <p>By default shows only frontpage posts, and can optionally include community posts.</p>
        <p>Frontpage posts are selected by moderators as especially interesting or useful to people with interest in doing good effectively.</p>
      </div>
    )

    return (
      <SingleColumnSection>
        <SectionTitle title={<Tooltip title={latestTitle} placement="left-start"><span>Latest Posts</span></Tooltip>}/>
        <PostsList2 terms={recentPostsTerms}>
          <Link to={"/allPosts"}>View All Posts</Link>
          <SectionFooterCheckbox 
            onClick={this.toggleFilter} 
            value={!(currentFilter === "frontpage")} 
            label={"Include Community Posts"}
            />
        </PostsList2>
      </SingleColumnSection>
    )
  }
}

const withUpdateOptions = {
  collection: Users,
  fragmentName: 'UsersCurrent',
}

registerComponent('HomeLatestPosts', HomeLatestPosts, withUser, withRouter, [withUpdate, withUpdateOptions]);
