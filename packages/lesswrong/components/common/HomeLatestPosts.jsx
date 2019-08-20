import { Components, registerComponent, withUpdate } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import withUser from '../common/withUser';
import Tooltip from '@material-ui/core/Tooltip';
import Users from 'meteor/vulcan:users';
import { Link } from '../../lib/reactRouterWrapper.js';
import { withLocation, withNavigation } from '../../lib/routeUtil';
import qs from 'qs'

class HomeLatestPosts extends PureComponent {

  toggleFilter = () => {
    const { updateUser, currentUser } = this.props
    const { location, history } = this.props // From withLocation, withNavigation
    const { query, pathname } = location;
    let newQuery = _.isEmpty(query) ? {view: "magic"} : query
    const currentFilter = newQuery.filter || (currentUser && currentUser.currentFrontpageFilter) || "frontpage";
    const newFilter = (currentFilter === "frontpage") ? "includeMetaAndPersonal" : "frontpage"

    if (currentUser) {
      updateUser({
        selector: { _id: currentUser._id},
        data: {
          currentFrontpageFilter: newFilter,
        },
      })
    }

    newQuery.filter = newFilter
    const newLocation = { pathname: pathname, search: qs.stringify(newQuery)};
    history.replace(newLocation);
  }

  render () {
    const { currentUser, location } = this.props;
    const { query } = location;
    const { SingleColumnSection, SectionTitle, PostsList2, SectionFooterCheckbox } = Components
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
        <p>By default shows only frontpage posts, and can optionally include personal blogposts.</p>
        <p><em>Moderators promote posts to frontpage if they seem to be:</em></p>
        <ul>
          <li>Aiming to explain rather than persuade</li>
          <li>Relatively timeless (avoiding reference to current events or local social knowledge)</li>
          <li>Reasonably relevant to the average LW user</li>
        </ul>
      </div>
    )

    const personalBlogpostTooltip = <div>
      <div>
        By default, the home page only displays Frontpage Posts, which meet criteria including:
      </div>
      <ul>
        <li>Usefulness, novelty and relevance</li>
        <li>Timeless content (minimize reference to current events</li>
        <li>Explain, rather than persuade</li>
      </ul>
      <div>
        Members can write about whatever they want on their personal blog. Personal blogposts are a good fit for:
      </div>
      <ul>
        <li>Niche topics, less relevant to most members</li>
        <li>Meta-discussion of LessWrong (site features, interpersonal community dynamics)</li>
        <li>Topics that are difficult to discuss rationally</li>
        <li>Personal ramblings</li>
      </ul>
      <div>
        All posts are submitted as personal blogposts. Moderators manually move some to frontpage
      </div>
    </div>

    return (
      <SingleColumnSection>
        <SectionTitle title={<Tooltip title={latestTitle} placement="left-start"><span>Latest Posts</span></Tooltip>}>
          <Tooltip title={personalBlogpostTooltip}>
            <div>
              <SectionFooterCheckbox 
                onClick={this.toggleFilter} 
                value={!(currentFilter === "frontpage")} 
                label={"Include Personal Blogposts"} 
                />
            </div>
          </Tooltip>
        </SectionTitle>
        <PostsList2 terms={recentPostsTerms}>
          <Link to={"/allPosts"}>Advanced Sorting/Filtering</Link>
        </PostsList2>
      </SingleColumnSection>
    )
  }
}

const withUpdateOptions = {
  collection: Users,
  fragmentName: 'UsersCurrent',
}

registerComponent('HomeLatestPosts', HomeLatestPosts,
  withUser, withLocation, withNavigation,
  [withUpdate, withUpdateOptions]);
