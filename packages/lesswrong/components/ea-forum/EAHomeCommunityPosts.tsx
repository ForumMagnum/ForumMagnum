import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import moment from '../../lib/moment-timezone';
import { useTimezone } from '../common/withTimezone';
import { EA_FORUM_COMMUNITY_TOPIC_ID } from '../../lib/collections/tags/collection';

const styles = (theme: ThemeType): JssStyles => ({

})

const EAHomeCommunityPosts = ({classes}:{classes: ClassesType}) => {
  const { timezone } = useTimezone()
  const { SingleColumnSection, PostsList2, SectionTitle, SectionFooter } = Components

  const now = moment().tz(timezone)
  const dateCutoff = now.subtract(90, 'days').format("YYYY-MM-DD")

  const recentPostsTerms = {
    view: "magic",
    filterSettings: {tags: [{
      tagId: EA_FORUM_COMMUNITY_TOPIC_ID,
      filterMode: 'Required'
    }]},
    after: dateCutoff,
    limit: 3
  }

  return (
    <AnalyticsContext pageSectionContext="communityPosts">
      <SingleColumnSection>
        <SectionTitle title="Posts about the community"></SectionTitle>
          <AnalyticsContext listContext={"communityPosts"}>
            <PostsList2 terms={recentPostsTerms} showLoadMore={false} />
            <SectionFooter>
              <Link to={"/topics/community"}>Read more</Link>
            </SectionFooter>
          </AnalyticsContext>
      </SingleColumnSection>
    </AnalyticsContext>
  )
}

const EAHomeCommunityPostsComponent = registerComponent('EAHomeCommunityPosts', EAHomeCommunityPosts, {styles});

declare global {
  interface ComponentTypes {
    EAHomeCommunityPosts: typeof EAHomeCommunityPostsComponent
  }
}
