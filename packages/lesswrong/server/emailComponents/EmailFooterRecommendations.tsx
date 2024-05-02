import React from 'react';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { registerComponent } from '../../lib/vulcan-lib/components';
import './EmailFormatDate';
import './EmailPostAuthors';
import './EmailContentItemBody';
import './EmailPostDate';
import { useRecommendations } from '../../components/recommendations/withRecommendations';
import { RecommendationsAlgorithm } from '../../lib/collections/users/recommendationSettings';

const styles = (theme: ThemeType): JssStyles => ({
  recommendedPostsHeader: {
    fontSize: '1rem'
  }
});

const EmailFooterRecommendations = ({classes}: {
  classes: ClassesType,
}) => {
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
  const {recommendationsLoading, recommendations} = useRecommendations({ algorithm })
  if (recommendationsLoading) return null
  return <>
    <h2 className={classes.recommendedPostsHeader}>Other Recommended Posts</h2>
    <ul>
      {/* TODO: Watch for this referrer */}
      {recommendations?.map(post => <li key={post._id}><a href={`${postGetPageUrl(post, true)}?referrer=emailfooter`}>{post.title}</a></li>)}
    </ul>
  </>
}

const EmailFooterRecommendationsComponent = registerComponent("EmailFooterRecommendations", EmailFooterRecommendations, {styles});

declare global {
  interface ComponentTypes {
    EmailFooterRecommendations: typeof EmailFooterRecommendationsComponent
  }
}
