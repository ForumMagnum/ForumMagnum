import React from 'react';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { useQuery } from "@/lib/crud/useQuery";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { gql } from "@/lib/generated/gql-codegen";
import { SpotlightItem } from "../spotlights/SpotlightItem";

const SpotlightDisplayQuery = gql(`
  query RotatingReviewWinnerSpotlightDisplay($documentId: String) {
    spotlight(input: { selector: { documentId: $documentId } }) {
      result {
        ...SpotlightDisplay
      }
    }
  }
`);

const RotatingReviewWinnerQuery = gql(`
  query RotatingReviewWinnerSpotlight {
    GetAllReviewWinners {
      ...PostForReviewWinnerItem
    }
  }
`);

const getTodayReviewInfo = (reviewWinners: RotatingReviewWinnerSpotlightQuery_GetAllReviewWinners_Post[], category: string) => {
  const categoryReviewWinners = reviewWinners.filter(reviewWinner => reviewWinner.reviewWinner?.category === category)
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
  const category = "ai safety"
  const { data } = useQuery(RotatingReviewWinnerQuery);
  const reviewWinnersWithPosts = [...data?.GetAllReviewWinners ?? []];
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

export default registerComponent('RotatingReviewWinnerSpotlight', RotatingReviewWinnerSpotlight);


