import React, { useState } from 'react';
import { Components, registerComponent, getSetting } from '../../lib/vulcan-lib';
import { useUpdate } from '../../lib/crud/withUpdate';
import { useCurrentUser } from '../common/withUser';
import Users from '../../lib/collections/users/collection';
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import qs from 'qs'
import {AnalyticsContext, captureEvent} from '../../lib/analyticsEvents';
import * as _ from 'underscore';
import { defaultFilterSettings, filterSettingsToString } from '../../lib/filterSettings';

const styles = theme => ({
  personalBlogpostsCheckbox: {
    // Hackily counteract margin from SectionFooterCheckbox
    // We probably shouldn't be using SectionFOOTERCheckbox in the SectionTitle,
    // but will probably refactor soon so won't bother fixing.
    [theme.breakpoints.down('xs')]: {
      marginBottom: -16,
    }
  },
  personalBlogpostsCheckboxLabel: {
    [theme.breakpoints.down("xs")]: {
      width: 105,
    },
  },
});

const latestPostsName = getSetting('forumType') === 'EAForum' ? 'Frontpage Posts' : 'Latest Posts'
const includePersonalName = getSetting('forumType') === 'EAForum' ? 'Include Community' : 'Include Personal Blogposts'

const useFilterSettings = (currentUser: UsersCurrent|null) => {
  const defaultSettings = currentUser ? currentUser.frontpageFilterSettings : defaultFilterSettings;
  
  return useState(defaultFilterSettings);
}

const HomeLatestPosts = ({ classes }: {
  classes: ClassesType
}) => {
  const currentUser = useCurrentUser();
  const location = useLocation();
  const { history } = useNavigation();
  
  const {mutate: updateUser} = useUpdate({
    collection: Users,
    fragmentName: 'UsersCurrent',
  });

  const [filterSettings, setFilterSettings] = useFilterSettings(currentUser);
  const [filterSettingsVisible, setFilterSettingsVisible] = useState(false);

  const toggleFilter = React.useCallback(() => {
    const { query, pathname } = location;
    let newQuery = _.isEmpty(query) ? {view: "magic"} : query
    const currentFilter = newQuery.filter || (currentUser && currentUser.currentFrontpageFilter) || "frontpage";
    const newFilter = (currentFilter === "frontpage") ? "includeMetaAndPersonal" : "frontpage"

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
    filterSettings: filterSettings,
    view: "magic",
    filter: currentFilter, //TODO
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
      <SectionTitle title={<LWTooltip title={latestTitle} placement="top"><span>{latestPostsName}</span></LWTooltip>}>
        <LWTooltip title={personalBlogpostTooltip}>
          { /*<div className={classes.personalBlogpostsCheckbox}>
            <SectionFooterCheckbox
              onClick={toggleFilter}
              value={currentFilter !== "frontpage"}
              label={<div className={classes.personalBlogpostsCheckboxLabel}>{includePersonalName}</div>}
              />
          </div> */ }
          <Components.SettingsIcon onClick={() => setFilterSettingsVisible(!filterSettingsVisible)} label={"Filter: "+filterSettingsToString(filterSettings)}/>
        </LWTooltip>
      </SectionTitle>
      {filterSettingsVisible && <Components.TagFilterSettings
        filterSettings={filterSettings} setFilterSettings={(newSettings) => {
          setFilterSettings(newSettings)
          updateUser({
            selector: { _id: currentUser._id},
            data: {
              frontpageFilterSettings: newSettings
            },
          })
        }}
      />}
      <AnalyticsContext listContext={"latestPosts"}>
        <PostsList2 terms={recentPostsTerms}>
          <Link to={"/allPosts"}>Advanced Sorting/Filtering</Link>
        </PostsList2>
      </AnalyticsContext>
    </SingleColumnSection>
  )
}

const HomeLatestPostsComponent = registerComponent('HomeLatestPosts', HomeLatestPosts, {styles});

declare global {
  interface ComponentTypes {
    HomeLatestPosts: typeof HomeLatestPostsComponent
  }
}
