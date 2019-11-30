import React, { useState } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  setting: {
    ...theme.typography.body2,
    color: theme.palette.grey[600]
  },
  settings: {
    marginBottom: theme.spacing.unit*2
  }
})

const Review2018 = ({classes}) => {
  const [sortByMost, setSortBy] = useState(false);

  const { SingleColumnSection, SectionTitle, PostsList2, MetaInfo } = Components

  return (
    <div>
      <SingleColumnSection>
        <SectionTitle title="Nominated Posts for the 2018 Review" />
        <div className={classes.settings}>
          <MetaInfo>
            <a className={classes.setting} onClick={() => setSortBy(!sortByMost)}>
              Sort by: {sortByMost ? "most" : "fewest"} nominations
            </a>
          </MetaInfo>
        </div>
        <PostsList2 
          terms={{view:"reviews2018", sortByMost: sortByMost, limit: 50}} 
          showNominationCount
          showReviewCount
          defaultToShowUnreadComments
          enableTotal
        />
      </SingleColumnSection>
    </div>
  )
}

registerComponent('Reviews2018', Reviews2018, withStyles(styles, {name:"Reviews2018"}));
