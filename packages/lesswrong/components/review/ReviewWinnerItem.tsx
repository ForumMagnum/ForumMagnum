// TODO: Import component in components.ts
import React from 'react';
import { Components, fragmentTextForQuery, registerComponent } from '../../lib/vulcan-lib';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { gql, useQuery } from '@apollo/client';
import { GetAllReviewWinnersQueryResult } from '../sequences/TopPostsPage';
import { useSingle } from '@/lib/crud/withSingle';

const getTodayReviewInfo = (reviewWinners: GetAllReviewWinnersQueryResult, category: string) => {
  const date = new Date()
  const categoryReviewWinners = reviewWinners.filter(reviewWinner => reviewWinner.reviewWinner.category === category)

  const totalWinners = categoryReviewWinners.length;
  if (totalWinners === 0) return null;
  // Calculate an index based on the date
  const startDate = new Date('2024-01-01');
  const daysSinceStart = Math.floor(
    (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const index = ((daysSinceStart % totalWinners) + totalWinners) % totalWinners; // Ensure non-negative index
  const selectedWinner = categoryReviewWinners[index];

  return selectedWinner;
};

export const ReviewWinnerItem = () => {
  const { SpotlightItem } = Components
  const category = "ai safety"
  const { data } = useQuery(
    gql`
      query GetAllReviewWinners {
        GetAllReviewWinners {
          ...PostForReviewWinnerItem
        }
      }
      ${fragmentTextForQuery('PostForReviewWinnerItem')}
    `,
  )
  const reviewWinnersWithPosts: GetAllReviewWinnersQueryResult = [...data?.GetAllReviewWinners ?? []];
  const winner = getTodayReviewInfo(reviewWinnersWithPosts, category);

  const { document } = useSingle({
    documentId: winner?.spotlight?._id,
    collectionName: "Spotlights",
    fragmentName: 'SpotlightDisplay',
    skip: !winner?.spotlight?._id,
    ssr: true,
  });
  if (!document) return null;

  return <AnalyticsContext pageSectionContext="reviewWinnerItem">
    <SpotlightItem spotlight={document}/>
  </AnalyticsContext>
}

const ReviewWinnerItemComponent = registerComponent('ReviewWinnerItem', ReviewWinnerItem);

declare global {
  interface ComponentTypes {
    ReviewWinnerItem: typeof ReviewWinnerItemComponent
  }
}
