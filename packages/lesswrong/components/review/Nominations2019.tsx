import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType) => ({
  setting: {
    ...theme.typography.body2,
    color: theme.palette.grey[600]
  },
  meta: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  info: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle
  }
})

const Nominations2019 = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const [sortByMost, setSortBy] = useState(false);

  const { SingleColumnSection, SectionTitle, PostsList2, RecentDiscussionThreadsList } = Components

  return (
    <div>
      <SingleColumnSection>
        <SectionTitle title="Nominated Posts for the 2019 Review"/>
        <div className={classes.meta}>
          <div className={classes.info}>
            <div>Posts need at least 2 nominations to continue into the Review Phase.</div>
            <div>Nominate posts that you have personally found useful and important.</div>
          </div>
          <a className={classes.setting} onClick={() => setSortBy(!sortByMost)}>
            Sort by: {sortByMost ? "most" : "fewest"} nominations
          </a>
        </div>
        <PostsList2 
          terms={{view:"nominations2019", sortByMost: sortByMost, limit: 50}} 
          showNominationCount
          showReviewCount
          enableTotal
        />
      </SingleColumnSection>
      <SingleColumnSection>
        {/* for the Review, it's more important to see all comments in Recent Discussion */}
        <RecentDiscussionThreadsList
          title="2019 Review Discussion"
          shortformButton={false}
          terms={{view: '2019reviewRecentDiscussionThreadsList', limit:20}}
          commentsLimit={4}
          maxAgeHours={100} 
          af={false}
        />
      </SingleColumnSection>
    </div>
  )
}

const Nominations2019Component = registerComponent('Nominations2019', Nominations2019, {styles});

declare global {
  interface ComponentTypes {
    Nominations2019: typeof Nominations2019Component
  }
}

