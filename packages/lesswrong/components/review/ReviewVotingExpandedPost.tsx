import React from 'react';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { getReviewPhase, REVIEW_YEAR } from '../../lib/reviewUtils';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { postPageTitleStyles } from '../posts/PostsPage/PostsPageTitle';
import { Link } from '../../lib/reactRouterWrapper';
import { useSingle } from '../../lib/crud/withSingle';

const styles = theme => ({
  postTitle: {
    ...postPageTitleStyles(theme),
    display: "block",
    marginBottom: 12
  },
  writeAReview: {
    paddingTop: 12,
    paddingLeft: 12,
    paddingRight: 12,
    paddingBottom: 8,
    border: "solid 1px rgba(0,0,0,.3)",
    marginBottom: 8,
  },
  reviewPrompt: {
    fontWeight: 600,
    fontSize: "1.2rem",
    color: "rgba(0,0,0,.87)",
    width: "100%",
    display: "block"
  },
  fakeTextfield: {
    marginTop: 5,
    width: "100%",
    borderBottom: "dashed 1px rgba(0,0,0,.25)",
    color: theme.palette.grey[400]
  },
})

const ReviewVotingExpandedPost = ({classes, post}:{classes: ClassesType, post?: PostsListWithVotes|null}) => {
  const { ReviewPostButton, ReviewPostComments, PostsHighlight, PingbacksList, Loading} = Components

  const {document: postWithContents, loading} = useSingle({
    documentId: post?._id,
    collectionName: "Posts",
    fetchPolicy: "cache-first",
    fragmentName: "PostsList",
  });

  const newPost = post || postWithContents

  if (!newPost) return null

  return <div>
    <Link to={postGetPageUrl(newPost)}  className={classes.postTitle}>{newPost.title}</Link>
    {postWithContents && <PostsHighlight post={postWithContents} maxLengthWords={90} forceSeeMore />}
    {loading && <Loading/>}
    <ReviewPostButton post={newPost} year={REVIEW_YEAR+""} reviewMessage={<div>
      <div className={classes.writeAReview}>
        <div className={classes.reviewPrompt}>Write a review for "{newPost.title}"</div>
        <div className={classes.fakeTextfield}>Any thoughts about this post you want to share with other voters?</div>
      </div>
    </div>}/>

    <div className={classes.comments}>
      <PingbacksList postId={newPost._id}/>
      {(getReviewPhase() !== "VOTING") && <ReviewPostComments
        title="Review"
        terms={{
          view: "reviews",
          reviewYear: REVIEW_YEAR, 
          postId: newPost._id
        }}
        post={newPost}
      />}
      <ReviewPostComments
        title="Unread Comment"
        terms={{
          view: "postsItemComments", 
          postId: newPost._id,
          limit:7, 
          after: newPost.lastVisitedAt
        }}
        post={newPost}
      />
    </div>
  </div>
}

const ReviewVotingExpandedPostComponent = registerComponent('ReviewVotingExpandedPost', ReviewVotingExpandedPost, {styles});

declare global {
  interface ComponentTypes {
    ReviewVotingExpandedPost: typeof ReviewVotingExpandedPostComponent
  }
}
