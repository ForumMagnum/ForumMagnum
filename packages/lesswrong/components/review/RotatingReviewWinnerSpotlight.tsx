import React from 'react';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { gql as graphql, useQuery } from '@apollo/client';
import { GetAllReviewWinnersQueryResult } from '../sequences/TopPostsPage';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { fragmentTextForQuery } from "../../lib/vulcan-lib/fragments";
import { gql } from "@/lib/generated/gql-codegen/gql";

const SpotlightDisplayQuery = gql(`
  query RotatingReviewWinnerSpotlightDisplay($documentId: String) {
    spotlight(input: { selector: { documentId: $documentId } }) {
      result {
        ...SpotlightDisplay
      }
    }
  }
`);

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
    graphql`
      query RotatingReviewWinnerSpotlight {
        GetAllReviewWinners {
          ...PostForReviewWinnerItem
        }
      }
      ${fragmentTextForQuery('PostForReviewWinnerItem')}
    `,
  )
  const reviewWinnersWithPosts: GetAllReviewWinnersQueryResult = [...data?.RotatingReviewWinnerSpotlight ?? []];
  const winner = getTodayReviewInfo(reviewWinnersWithPosts, category);

  const { data: dataSpotlight } = useQuery(SpotlightDisplayQuery, {
    variables: { documentId: winner?.spotlight?._id },
    skip: !winner?.spotlight?._id,
    ssr: true,
  });
  const document = dataSpotlight?.spotlight?.result;
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
