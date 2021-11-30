import React from 'react';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { REVIEW_YEAR } from '../../lib/reviewUtils';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { postPageTitleStyles } from '../posts/PostsPage/PostsPageTitle';
import { REVIEW_COMMENTS_VIEW } from './ReviewVotingPage';
import { Link } from '../../lib/reactRouterWrapper';

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
  const { ReviewPostButton, ReviewPostComments, PostsHighlight} = Components

  if (!post) return null

  return <div className={classes.root}>
      <Link to={postGetPageUrl(post)}  className={classes.postTitle}>{post.title}</Link>
      <PostsHighlight post={post} maxLengthWords={90} forceSeeMore /> 
      <ReviewPostButton post={post} year={REVIEW_YEAR+""} reviewMessage={<div>
        <div className={classes.writeAReview}>
          <div className={classes.reviewPrompt}>Write a review for "{post.title}"</div>
          <div className={classes.fakeTextfield}>Any thoughts about this post you want to share with other voters?</div>
        </div>
      </div>}/>

      <div className={classes.comments}>
        <ReviewPostComments
          title="Reviews"
          terms={{
            view: REVIEW_COMMENTS_VIEW, 
            postId: post._id
          }}
          post={post}
        />
        <ReviewPostComments
          title="Unread Comments"
          terms={{
            view: "postsItemComments", 
            postId: post._id,
            limit:7, 
            after: post.lastVisitedAt
          }}
          post={post}
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

function recordPostView(arg0: { post: PostsListWithVotes; extraEventProperties: { type: string; }; }) {
  throw new Error('Function not implemented.');
}


function setMarkedVisitedAt(arg0: Date) {
  throw new Error('Function not implemented.');
}
