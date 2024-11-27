// TODO: Import component in components.ts
import React, { useEffect, useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { useMulti } from '@/lib/crud/withMulti';
import { ReviewWinners } from '@/lib/collections/reviewWinners/collection';
import { reviewYears } from '@/lib/reviewUtils';
import { REVIEW_WINNER_CACHE } from '@/lib/collections/reviewWinners/cache';

const styles = (theme: ThemeType) => ({
  root: {

  }
});

const getTodayReviewInfo = (category: string) => {



  const date = new Date()
  const reviewWinners = REVIEW_WINNER_CACHE.reviewWinners
  const afReviewWinners = reviewWinners.filter(reviewWinner => reviewWinner.reviewWinner.category === "ai safety")

  const totalWinners = afReviewWinners.length;

  // Calculate an index based on the date
  const startDate = new Date('2024-01-02'); // Set a fixed start date
  const daysSinceStart = Math.floor(
    (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const index = ((daysSinceStart % totalWinners) + totalWinners) % totalWinners; // Ensure non-negative index

  const selectedWinner = reviewWinners[index];

  return {
    reviewYear: selectedWinner.reviewWinner?.reviewYear,
    reviewRanking: selectedWinner.reviewWinner?.reviewRanking,
  };
};

export const ReviewWinnerItem = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  const category = "ai safety"
  const { reviewYear, reviewRanking } = getTodayReviewInfo(category);

  const { results } = useMulti({
    collectionName: "ReviewWinners",
    fragmentName: "ReviewWinnerTopPostsDisplay",
    terms: { view: "reviewWinners", category, reviewYear, reviewRanking, limit: 1 },
  });
  const winner = results?.[0]

  return <div className={classes.root}>
    {winner?.post?.title}
  </div>;
}

const ReviewWinnerItemComponent = registerComponent('ReviewWinnerItem', ReviewWinnerItem, {styles});

declare global {
  interface ComponentTypes {
    ReviewWinnerItem: typeof ReviewWinnerItemComponent
  }
}
