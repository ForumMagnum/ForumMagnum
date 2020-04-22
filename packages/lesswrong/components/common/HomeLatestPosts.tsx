import React, { useState } from 'react';
import { Components, registerComponent, getSetting } from '../../lib/vulcan-lib';
import { useUpdate } from '../../lib/crud/withUpdate';
import { useCurrentUser } from '../common/withUser';
import Users from '../../lib/collections/users/collection';
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import { useTimezone } from './withTimezone';
import { AnalyticsContext, useTracking } from '../../lib/analyticsEvents';
import * as _ from 'underscore';
import { defaultFilterSettings, filterSettingsToString } from '../../lib/filterSettings';
import moment from '../../lib/moment-timezone';

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

const useFilterSettings = (currentUser: UsersCurrent|null) => {
  const defaultSettings = currentUser?.frontpageFilterSettings ? currentUser.frontpageFilterSettings : defaultFilterSettings;

  return useState(defaultSettings);
}

const HomeLatestPosts = ({ classes }: {
  classes: ClassesType
}) => {
  const currentUser = useCurrentUser();
  const location = useLocation();
  const { captureEvent } = useTracking()

  const {mutate: updateUser} = useUpdate({
    collection: Users,
    fragmentName: 'UsersCurrent',
  });

  const [filterSettings, setFilterSettings] = useFilterSettings(currentUser);
  const [filterSettingsVisible, setFilterSettingsVisible] = useState(false);
  const { timezone } = useTimezone();

  const { query } = location;
  const { SingleColumnSection, SectionTitle, PostsList2, LWTooltip, TagFilterSettings, SettingsIcon } = Components
  const limit = parseInt(query.limit) || 13
  const now = moment().tz(timezone);
  const dateCutoff = now.subtract(90, 'days').format("YYYY-MM-DD");

  const recentPostsTerms = {
    ...query,
    filterSettings: filterSettings,
    after: dateCutoff,
    view: "magic",
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

  const filterTooltip = "Change filters on coronavirus content and personal blogposts in the Latest Posts section."

  return (
    <AnalyticsContext pageSectionContext="latestPosts">
        <SingleColumnSection>
          <SectionTitle title={<LWTooltip title={latestTitle} placement="top"><span>{latestPostsName}</span></LWTooltip>}>
            <LWTooltip title={filterTooltip}>
              <SettingsIcon
                onClick={() => {
                  setFilterSettingsVisible(!filterSettingsVisible)
                  captureEvent("filterSettingsClicked", {
                    settingsVisible: !filterSettingsVisible,
                    settings: filterSettings,
                    pageSectionContext: "latestPosts"
                  })
                }}
                label={"Filter: "+filterSettingsToString(filterSettings)}/>
            </LWTooltip>
          </SectionTitle>
          {filterSettingsVisible && <TagFilterSettings
            filterSettings={filterSettings} setFilterSettings={(newSettings) => {
              setFilterSettings(newSettings)
              if (currentUser) {
                updateUser({
                  selector: { _id: currentUser._id},
                  data: {
                    frontpageFilterSettings: newSettings
                  },
                })
              }
            }}
          />}
          <AnalyticsContext listContext={"latestPosts"}>
            <PostsList2 terms={recentPostsTerms}>
              <Link to={"/allPosts"}>Advanced Sorting/Filtering</Link>
            </PostsList2>
          </AnalyticsContext>
        </SingleColumnSection>
    </AnalyticsContext>
  )
}

const HomeLatestPostsComponent = registerComponent('HomeLatestPosts', HomeLatestPosts, {styles});

declare global {
  interface ComponentTypes {
    HomeLatestPosts: typeof HomeLatestPostsComponent
  }
}
