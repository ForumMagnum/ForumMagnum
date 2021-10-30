import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';

const REVIEW_YEAR = 2020

const PostsByVote = () => {
    const { SectionTitle, PostsItem2, SingleColumnSection } = Components
    const currentUser = useCurrentUser()
    if (!currentUser) return null

    const before = `${REVIEW_YEAR + 1}-01-01`
    const after = `${REVIEW_YEAR}-01-01`

    const { results: votes } = useMulti({
        terms: {
          view: "userPostVotes",
          userId: currentUser._id,
          collectionName: "Posts",
          voteType: "bigUpvote",
          before: before,
          after: after
        },
        collectionName: "Votes",
        fragmentName: "UserVotes",
        limit: 1000
      });

    if (!votes) return null
    const postIds = votes.map(vote=>vote.documentId)

    const { results: posts } = useMulti({
      terms: {
        view: "nominatablePostsByVote",
        postIds: postIds,
        userId: currentUser._id,
        before: before,
        after: after
      },
      collectionName: "Posts",
      fragmentName: "PostsList",
      limit: 1000,
    })

    return <SingleColumnSection>
        <SectionTitle title={`Your Strong Upvotes from ${REVIEW_YEAR}`}/>
        {posts?.map(post=> <PostsItem2 post={post} />)}
    </SingleColumnSection>
}

const PostsByVoteComponent = registerComponent("PostsByVote", PostsByVote);

declare global {
  interface ComponentTypes {
    PostsByVote: typeof PostsByVoteComponent
  }
}

