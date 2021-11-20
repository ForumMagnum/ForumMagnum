import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
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

export const REVIEW_YEAR = 2020

const Nominations2020 = ({classes}: {
  classes: ClassesType,
}) => {
  const [sortByMost, setSortBy] = useState(false);

  const { SingleColumnSection, SectionTitle, PostsList2, RecentDiscussionThreadsList, FrontpageReviewPhase } = Components

  return (
    <div>
      <FrontpageReviewPhase/>
      <SingleColumnSection>
        <SectionTitle title={`Nominated Posts for the ${REVIEW_YEAR} Review`}/>
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
          terms={{view:"nominations", year:REVIEW_YEAR, sortByMost: sortByMost, limit: 50}} 
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

const Nominations2020Component = registerComponent('Nominations2020', Nominations2020, {styles});

declare global {
  interface ComponentTypes {
    Nominations2020: typeof Nominations2020Component
  }
}

