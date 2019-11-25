import React, { useState } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  setting: {
    ...theme.typography.body2,
    color: theme.palette.grey[600]
  }
})

const Nominations2018 = ({classes}) => {
  const [sortByMost, setSortBy] = useState(false);

  const { SingleColumnSection, SectionTitle, PostsList2, RecentDiscussionThreadsList } = Components

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
          dense
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

registerComponent('Nominations2018', Nominations2018, withStyles(styles, {name:"Nominations2018"}));
