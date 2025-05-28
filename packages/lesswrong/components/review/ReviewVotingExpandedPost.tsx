import React from 'react';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { getReviewPhase, REVIEW_YEAR } from '../../lib/reviewUtils';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { postPageTitleStyles } from '../posts/PostsPage/PostsPageTitle';
import { Link } from '../../lib/reactRouterWrapper';
import KeyboardBackspaceIcon from '@/lib/vendor/@material-ui/icons/src/KeyboardBackspace';
import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";
import { CENTRAL_COLUMN_WIDTH } from '../posts/PostsPage/constants';
import ReviewPostComments from "./ReviewPostComments";
import PostsHighlight from "../posts/PostsHighlight";
import PingbacksList from "../posts/PingbacksList";
import Loading from "../vulcan-core/Loading";


const PostsListQuery = gql(`
  query ReviewVotingExpandedPost($documentId: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostsList
      }
    }
  }
`);

const styles = (theme: ThemeType) => ({
  root: {
    maxWidth: CENTRAL_COLUMN_WIDTH,
    margin: "0 auto",
  },
  postTitle: {
    ...postPageTitleStyles(theme),
    display: "block",
    marginBottom: 36
  },
  writeAReview: {
    paddingTop: 12,
    paddingLeft: 12,
    paddingRight: 12,
    paddingBottom: 8,
    border: theme.palette.border.slightlyIntense2,
    marginBottom: 8,
  },
  reviewPrompt: {
    fontWeight: 600,
    fontSize: "1.2rem",
    color: theme.palette.text.normal,
    width: "100%",
    display: "block"
  },
  fakeTextfield: {
    marginTop: 5,
    width: "100%",
    borderBottom: `dashed 1px ${theme.palette.greyAlpha(0.25)}`,
    color: theme.palette.grey[400]
  },
  backButton: {
    display: "flex",
    alignItems: "center",
    marginBottom: 30,
    ...theme.typography.body2,
    color: theme.palette.grey[400],
    cursor: "pointer",
    '&:hover': {
      opacity: .5
    }
  },
  backIcon: {
    marginLeft: 12,
    transform: "rotate(180deg)",
  },
  reviewVoting: {
    padding: theme.spacing.unit*2,
    paddingBottom: theme.spacing.unit*2,
    position: "relative",
    right: theme.spacing.unit*4
  }
})

const ReviewVotingExpandedPost = ({classes, post, setExpandedPost}: {
  classes: ClassesType<typeof styles>,
  post?: PostsReviewVotingList|null,
  setExpandedPost: (post: PostsReviewVotingList|null) => void
}) => {
  const { loading, data } = useQuery(PostsListQuery, {
    variables: { documentId: post?._id },
    fetchPolicy: "cache-first",
  });
  const postWithContents = data?.post?.result;

  const newPost = post || postWithContents

  if (!newPost) return null

  return <div className={classes.root}>
    <div className={classes.backButton} onClick={() => setExpandedPost(null)}>
      Back <KeyboardBackspaceIcon className={classes.backIcon}/> 
    </div>
    <Link to={postGetPageUrl(newPost)}  className={classes.postTitle}>
      {newPost.title}
    </Link>
    {postWithContents && <PostsHighlight post={postWithContents} maxLengthWords={200} forceSeeMore />}
    {loading && <Loading/>}

    <div>
      <PingbacksList postId={newPost._id} limit={3}/>
      {(getReviewPhase() !== "VOTING") && <ReviewPostComments
        title="Review"
        terms={{
          view: "reviews",
          reviewYear: REVIEW_YEAR, 
          postId: newPost._id,
        }}
        post={newPost}
      />}
      <ReviewPostComments
        title="Recent Comment"
        terms={{
          view: "postsItemComments", 
          postId: newPost._id,
          limit:7
        }}
        post={newPost}
      />
    </div>
  </div>
}

export default registerComponent('ReviewVotingExpandedPost', ReviewVotingExpandedPost, {styles});


