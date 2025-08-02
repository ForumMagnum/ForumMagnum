import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { getVotingSystemByName } from '../../lib/voting/getVotingSystem';
import PostsVoteDefault from "./PostsVoteDefault";
import { postBottomVotingComponents } from '@/lib/voting/votingSystemComponents';
import type { VotingSystemName } from '@/lib/voting/votingSystemNames';

const PostsVote = ({post, useHorizontalLayout, isFooter}: {
  post: PostsWithVotes,
  /** if true, display the vote arrows to the left & right of the score */
  useHorizontalLayout?: boolean,
  /** if true, this vote is in the footer underneath the post */
  isFooter?: boolean,
}) => {
  const votingSystemName = (post.votingSystem || "default") as VotingSystemName;
  const votingSystem = getVotingSystemByName(votingSystemName);
  const Component = postBottomVotingComponents[votingSystemName]?.() ?? null;
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
      />
    );
}

export default registerComponent('PostsVote', PostsVote);


