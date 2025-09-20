import React from 'react';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { useRecommendations } from '../../components/recommendations/withRecommendations';
import { RecommendationsAlgorithm } from '../../lib/collections/users/recommendationSettings';
import { defineStyles } from "@/components/hooks/defineStyles";
import { EmailContextType, useEmailStyles } from "./emailContext";
import { useEmailQuery } from '../vulcan-lib/query';
import { gql } from '@/lib/generated/gql-codegen';

const styles = defineStyles("EmailFooterRecommendations", (theme: ThemeType) => ({
  recommendedPostsHeader: {
    fontSize: '1rem'
  }
}));

export const EmailFooterRecommendations = async ({emailContext}: {
  emailContext: EmailContextType
}) => {
  const classes = useEmailStyles(styles, emailContext);
  const algorithm: RecommendationsAlgorithm = {
    method: "sample",
    count: 5,
    scoreOffset: 0,
    scoreExponent: 3,
    personalBlogpostModifier: 0,
    includePersonal: false,
    includeMeta: false,
    frontpageModifier: 10,
    curatedModifier: 50,
    onlyUnread: true,
  }
  
  const recommendationsResult = await useEmailQuery(gql(`
    query EmailFooterRecommendationsQuery($count: Int, $algorithm: JSON) {
      Recommendations(count: $count, algorithm: $algorithm) {
        ...PostsListWithVotesAndSequence
      }
    }
  `), {
    variables: {
      count: algorithm.count,
      algorithm: algorithm,
    },
    emailContext
  });
  const recommendations = recommendationsResult?.data?.Recommendations;

  return <>
    <h2 className={classes.recommendedPostsHeader}>Other Recommended Posts</h2>
    <ul>
      {/* TODO: Watch for this referrer */}
      {recommendations?.map(post => <li key={post._id}><a href={`${postGetPageUrl(post, true)}?referrer=emailfooter`}>{post.title}</a></li>)}
    </ul>
  </>
}

