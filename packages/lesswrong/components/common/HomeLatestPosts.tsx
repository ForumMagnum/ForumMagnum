import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
import { useUpdate } from '../../lib/crud/withUpdate';
import React from 'react';
import { useCurrentUser } from '../common/withUser';
import Users from 'meteor/vulcan:users';
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import qs from 'qs'
import { withStyles, createStyles } from '@material-ui/core/styles';
import {AnalyticsContext, captureEvent} from '../../lib/analyticsEvents';
import * as _ from 'underscore';

const styles = createStyles(theme => ({
  personalBlogpostsCheckbox: {
    // Hackily counteract margin from SectionFooterCheckbox
    // We probably shouldn't be using SectionFOOTERCheckbox in the SectionTitle,
    // but will probably refactor soon so won't bother fixing.
    [theme.breakpoints.down('xs')]: {
      marginBottom: -16,
    }
  },
  personalBlogpostsCheckboxLabel: {
    display: "inline-block",
    verticalAlign: "middle",

    [theme.breakpoints.down("xs")]: {
      width: 105,
    },
  },
}));

const latestPostsName = getSetting('forumType') === 'EAForum' ? 'Frontpage Posts' : 'Latest Posts'
const includePersonalName = getSetting('forumType') === 'EAForum' ? 'Include Community' : 'Include Personal Blogposts'

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
    const newFilter = (currentFilter === "frontpage") ? "frontpageAndMeta" : "frontpage"

    captureEvent("personalBlogpostsToggled", {state: (newFilter !== "frontpage")});

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
  const limit = parseInt(query.limit) || 13

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

  const personalBlogpostTooltip = <div>
    <div>
      By default, the home page only displays Frontpage Posts, which are selected by moderators as especially interesting or useful to people with interest in doing good effectively.
    </div>
    <div>
      Include community posts to get posts with topical content or which relate to the EA community itself.
    </div>
  </div>

  return (
    <SingleColumnSection>
      <SectionTitle title={<LWTooltip title={latestTitle} placement="top"><span>{latestPostsName}</span></LWTooltip>}>
        <LWTooltip title={personalBlogpostTooltip}>
          <div className={classes.personalBlogpostsCheckbox}>
            <SectionFooterCheckbox
              onClick={toggleFilter}
              value={currentFilter !== "frontpage"}
              label={<div className={classes.personalBlogpostsCheckboxLabel}>{includePersonalName}</div>}
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

const HomeLatestPostsComponent = registerComponent('HomeLatestPosts', HomeLatestPosts,
  withStyles(styles, {name: "HomeLatestPosts"}));

declare global {
  interface ComponentTypes {
    HomeLatestPosts: typeof HomeLatestPostsComponent
  }
}
