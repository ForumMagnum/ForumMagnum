import React, { useState } from 'react';
import { Components, registerComponent, getSetting } from '../../lib/vulcan-lib';
import { useUpdate } from '../../lib/crud/withUpdate';
import { useCurrentUser } from '../common/withUser';
import Users from '../../lib/collections/users/collection';
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import qs from 'qs'
import { AnalyticsContext, useTracking } from '../../lib/analyticsEvents';
import * as _ from 'underscore';
import { defaultFilterSettings, filterSettingsToString } from '../../lib/filterSettings';

const latestPostsName = getSetting('forumType') === 'EAForum' ? 'Frontpage Posts' : 'Latest Posts'

const useFilterSettings = (currentUser: UsersCurrent|null) => {
  const defaultSettings = currentUser?.frontpageFilterSettings ? currentUser.frontpageFilterSettings : defaultFilterSettings;

  return useState(defaultSettings);
}

const HomeLatestPosts = () => {
  const currentUser = useCurrentUser();
  const location = useLocation();
  const { captureEvent } = useTracking()

  const {mutate: updateUser} = useUpdate({
    collection: Users,
    fragmentName: 'UsersCurrent',
  });

  const [filterSettings, setFilterSettings] = useFilterSettings(currentUser);
  const [filterSettingsVisible, setFilterSettingsVisible] = useState(false);

  const { query } = location;
  const { SingleColumnSection, SectionTitle, PostsList2, LWTooltip, TagFilterSettings, SettingsIcon } = Components
  const limit = parseInt(query.limit) || 13
  const recentPostsTerms = {
    ...query,
    filterSettings: filterSettings,
    view: "magic",
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

  const filterTooltip = "Change filters on coronavirus content and community posts in the Frontpage Posts section."

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

const HomeLatestPostsComponent = registerComponent('HomeLatestPosts', HomeLatestPosts);

declare global {
  interface ComponentTypes {
    HomeLatestPosts: typeof HomeLatestPostsComponent
  }
}
