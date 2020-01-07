import { Components, registerComponent, useUpdate } from 'meteor/vulcan:core';
import React from 'react';
import { useCurrentUser } from '../common/withUser';
import Users from 'meteor/vulcan:users';
import { Link } from '../../lib/reactRouterWrapper.jsx';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import qs from 'qs'
import { withStyles } from '@material-ui/core/styles';
import {AnalyticsContext, captureEvent} from '../../lib/analyticsEvents';

const styles = theme => ({
  personalBlogpostsCheckboxLabel: {
    display: "inline-block",
    verticalAlign: "middle",
    
    [theme.breakpoints.down("xs")]: {
      width: 105,
    },
  },
});

const HomeLatestPosts = ({ classes }) =>
{
  const currentUser = useCurrentUser();
  const location = useLocation();
  const { history } = useNavigation();
  
  const {mutate: updateUser} = useUpdate({
    collection: Users,
    fragmentName: 'UsersCurrent',
  });
  
  const toggleFilter = React.useCallback(() => {
    const { query, pathname } = location;
    let newQuery = _.isEmpty(query) ? {view: "magic"} : query
    const currentFilter = newQuery.filter || (currentUser && currentUser.currentFrontpageFilter) || "frontpage";
    const newFilter = (currentFilter === "frontpage") ? "includeMetaAndPersonal" : "frontpage"

    captureEvent("personalBlogpostsToggled", {"checked": (newFilter !== "frontpage")});

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
  }, [updateUser, location, history, currentUser]);

  const { query } = location;
  const { SingleColumnSection, SectionTitle, PostsList2, SectionFooterCheckbox, LWTooltip } = Components
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
      <li>Timeless content (minimize reference to current events)</li>
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
      <SectionTitle title={<LWTooltip title={latestTitle} placement="top"><span>Latest Posts</span></LWTooltip>}>
        <LWTooltip title={personalBlogpostTooltip}>
          <div>
            <SectionFooterCheckbox
              onClick={toggleFilter}
              value={currentFilter !== "frontpage"}
              label={<div className={classes.personalBlogpostsCheckboxLabel}>Include Personal Blogposts</div>}
              />
          </div>
        </LWTooltip>
      </SectionTitle>
      <AnalyticsContext listContext={"latestPosts"}>
        <PostsList2 terms={recentPostsTerms}>
          <Link to={"/allPosts"}>Advanced Sorting/Filtering</Link>
        </PostsList2>
      </AnalyticsContext>
    </SingleColumnSection>
  )
}

registerComponent('HomeLatestPosts', HomeLatestPosts,
  withStyles(styles, {name: "HomeLatestPosts"}));
