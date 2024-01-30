import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { getVotingSystemByName } from '../../lib/voting/votingSystems';
import { AnnualReviewMarketInfo, getMarketInfo } from '../../lib/annualReviewMarkets';

const PostsVote = ({post, useHorizontalLayout, isFooter}: {
  post: PostsWithVotes,
  /** if true, display the vote arrows to the left & right of the score */
  useHorizontalLayout?: boolean,
  /** if true, this vote is in the footer underneath the post */
  isFooter?: boolean,
}) => {
  const votingSystemName = post.votingSystem || "default";
  const votingSystem = getVotingSystemByName(votingSystemName);
  const {PostsVoteDefault} = Components;
  const Component = votingSystem?.getPostBottomVotingComponent?.();
  const annualReviewMarketInfo : AnnualReviewMarketInfo | null = getMarketInfo(post)

  return Component
    ? (
      <Component
        document={post}
        votingSystem={votingSystem}
        isFooter={isFooter}
      />
    )
    : (
      <PostsVoteDefault
        post={post}
        useHorizontalLayout={useHorizontalLayout}
        votingSystem={votingSystem}
        isFooter={isFooter}
        annualReviewMarketInfo={annualReviewMarketInfo}
      />
    );
}

const PostsVoteComponent = registerComponent('PostsVote', PostsVote);

declare global {
  interface ComponentTypes {
    PostsVote: typeof PostsVoteComponent
  }
}
