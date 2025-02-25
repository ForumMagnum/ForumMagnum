import React from 'react';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { gql, useQuery } from '@apollo/client';
import { GetAllReviewWinnersQueryResult } from '../sequences/TopPostsPage';
import { useSingle } from '@/lib/crud/withSingle';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { fragmentTextForQuery } from "../../lib/vulcan-lib/fragments";

const getTodayReviewInfo = (reviewWinners: GetAllReviewWinnersQueryResult, category: string) => {
  const categoryReviewWinners = reviewWinners.filter(reviewWinner => reviewWinner.reviewWinner.category === category)
  const totalWinners = categoryReviewWinners.length;
  if (totalWinners === 0) return null;
  
  // Calculate an index based on the date
  const date = new Date()
  const startDate = new Date('2024-01-03');
  const daysSinceStart = Math.floor(
    (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const index = ((daysSinceStart % totalWinners) + totalWinners) % totalWinners; // Ensure non-negative index (LLM)
  
  return categoryReviewWinners[index];
};

export const RotatingReviewWinnerSpotlight = () => {
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

const RotatingReviewWinnerSpotlightComponent = registerComponent('RotatingReviewWinnerSpotlight', RotatingReviewWinnerSpotlight);

declare global {
  interface ComponentTypes {
    RotatingReviewWinnerSpotlight: typeof RotatingReviewWinnerSpotlightComponent
  }
}
