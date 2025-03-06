import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import SingleColumnSection from "@/components/common/SingleColumnSection";
import { SectionTitle } from "@/components/common/SectionTitle";
import PostsList2 from "@/components/posts/PostsList2";
import RecentDiscussionThreadsList from "@/components/recentDiscussion/RecentDiscussionThreadsList";

const styles = (theme: ThemeType) => ({
  setting: {
    ...theme.typography.body2,
    color: theme.palette.grey[600]
  }
})

const Nominations2018 = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const [sortByMost, setSortBy] = useState(false);
  return (
    <div>
      <SingleColumnSection>
        <SectionTitle title="Nominated Posts for the 2018 Review">
          <a className={classes.setting} onClick={() => setSortBy(!sortByMost)}>
            Sort by: {sortByMost ? "most" : "fewest"} nominations
          </a>
        </SectionTitle>
        <PostsList2 
          terms={{view:"nominations2018", sortByMost: sortByMost, limit: 50}} 
          showNominationCount
          enableTotal
        />
      </SingleColumnSection>
      <SingleColumnSection>
        {/* for the Review, it's more important to see all comments in Recent Discussion */}
        <RecentDiscussionThreadsList
          title="2018 Review Discussion"
          shortformButton={false}
          terms={{view: '2018reviewRecentDiscussionThreadsList', limit:20}}
          commentsLimit={4}
          maxAgeHours={100} 
          af={false}
        />
      </SingleColumnSection>
    </div>
  )
}

const Nominations2018Component = registerComponent('Nominations2018', Nominations2018, {styles});

declare global {
  interface ComponentTypes {
    Nominations2018: typeof Nominations2018Component
  }
}

export default Nominations2018Component;

