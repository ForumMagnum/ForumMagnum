import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useUpdate } from '../../lib/crud/withUpdate';
import { useCurrentUser } from '../common/withUser';
import Users from '../../lib/collections/users/collection';
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation } from '../../lib/routeUtil';
import { useTimezone } from './withTimezone';
import { AnalyticsContext, useTracking } from '../../lib/analyticsEvents';
import * as _ from 'underscore';
import { defaultFilterSettings } from '../../lib/filterSettings';
import moment from '../../lib/moment-timezone';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { sectionTitleStyle } from '../common/SectionTitle';
import Typography from '@material-ui/core/Typography';

const styles = theme => ({
  toggleFilters: {
    display: "flex",
    alignItems: "center",
    color: theme.palette.grey[600],
    fontStyle: "italic"
  },
  rightIcon: {
    marginLeft: -6,
  },
  downIcon: {
    marginLeft: -4,
    marginRight: 3
  },
  titleWrapper: {
    display: "flex",
    marginBottom: 8,
    flexWrap: "wrap",
    alignItems: "center"
  },
  title: {
    ...sectionTitleStyle(theme),
    display: "inline",
    marginRight: "auto"
  }
})

const latestPostsName = forumTypeSetting.get() === 'EAForum' ? 'Frontpage Posts' : 'Latest'

const useFilterSettings = (currentUser: UsersCurrent|null) => {
  const defaultSettings = currentUser?.frontpageFilterSettings ? currentUser.frontpageFilterSettings : defaultFilterSettings;

  return useState(defaultSettings);
}

const HomeLatestPosts = ({classes}:{classes: ClassesType}) => {
  const currentUser = useCurrentUser();
  const location = useLocation();

  const {mutate: updateUser} = useUpdate({
    collection: Users,
    fragmentName: 'UsersCurrent',
  });

  const [filterSettings, setFilterSettings] = useFilterSettings(currentUser);
  const [filterSettingsVisible, setFilterSettingsVisible] = useState(false);
  const { timezone } = useTimezone();
  useTracking({eventType:"frontpageFilterSettings", eventProps: {filterSettings, filterSettingsVisible}, captureOnMount: true})

  const { query } = location;
  const { SingleColumnSection, PostsList2, TagFilterSettings } = Components
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


  return (
    <AnalyticsContext pageSectionContext="latestPosts">
      <SingleColumnSection>
        <div className={classes.titleWrapper}>
          <Typography variant='display1' className={classes.title}>
            {latestPostsName}
          </Typography>
         
          <AnalyticsContext pageSectionContext="tagFilterSettings">
              <TagFilterSettings
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
            />
          </AnalyticsContext>
        </div>
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
