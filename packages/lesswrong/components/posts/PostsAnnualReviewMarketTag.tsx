import { AnnualReviewMarketInfo } from '../../lib/annualReviewMarkets';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';

const styles = (theme: ThemeType) => ({
    expectedWinner: {
      color: theme.palette.text.aprilFools.orange,
    },
  });

const PostsAnnualReviewMarketTag = ({annualReviewMarketInfo, classes}: {
    annualReviewMarketInfo: AnnualReviewMarketInfo | null,
    classes: ClassesType<typeof styles>,
  })  => {
    if (!annualReviewMarketInfo) {
      return <div></div>;
    }
  return <div className={classes.expectedWinner}>This post is gonna win! with probability {parseFloat((annualReviewMarketInfo?.probability*100).toFixed(2))}%</div>
};

const PostsAnnualReviewMarketTagComponent = registerComponent('PostsAnnualReviewMarketTag', PostsAnnualReviewMarketTag, {styles});

declare global {
  interface ComponentTypes {
    PostsAnnualReviewMarketTag: typeof PostsAnnualReviewMarketTagComponent
  }
}
