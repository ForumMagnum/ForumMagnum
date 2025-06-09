import React from 'react';
import { forumTitleSetting } from '../../lib/instanceSettings';
import { REVIEW_NAME_IN_SITU, REVIEW_YEAR } from '../../lib/reviewUtils';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { POST_PREVIEW_WIDTH } from '../posts/PostsPreviewTooltip/helpers';
import { notificationLoadingStyles } from '../posts/PostsPreviewTooltip/PostsPreviewLoading';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import Loading from "../vulcan-core/Loading";
import PostsTitle from "../posts/PostsTitle";
import ReviewPostButton from "./ReviewPostButton";
import LWTooltip from "../common/LWTooltip";
import ContentStyles from "../common/ContentStyles";

const PostsListQuery = gql(`
  query PostNominatedNotification($documentId: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostsList
      }
    }
  }
`);

const styles = (theme: ThemeType) => ({
  root: {
    padding: theme.spacing.unit*1.5,
    width: POST_PREVIEW_WIDTH,
  },
  loading: {
    ...notificationLoadingStyles(theme)
  },
  reviewButton: {
    padding: theme.spacing.unit,
    textAlign: "center"
  }
})

const PostNominatedNotification = ({classes, postId}: {classes: ClassesType<typeof styles>, postId: string}) => {
  const { loading, data } = useQuery(PostsListQuery, {
    variables: { documentId: postId },
    fetchPolicy: 'cache-first',
  });
  
  const post = data?.post?.result;

  if (loading) return <div className={classes.loading}>
    <Loading/>
  </div>

  if (!post) return <div className={classes.root}>Error</div>

  return <div className={classes.root}>
    <PostsTitle post={post}/>
    <ContentStyles contentType="comment">
      <p>Your post has been nominated for the {REVIEW_NAME_IN_SITU}.</p>
      <p>You're encouraged to write a self-review, exploring how you think about the post today. Do you still endorse it? Have you learned anything new that adds more depth? How might you improve the post? What further work do you think should be done exploring the ideas here?</p>
      <div className={classes.reviewButton}>
        <ReviewPostButton post={post} year={REVIEW_YEAR+""} reviewMessage={<LWTooltip title={`Write up your thoughts on what was good about a post, how it could be improved, and how you think stands the tests of time as part of the broader ${forumTitleSetting.get()} conversation`} placement="bottom">
            <div className={classes.reviewButton}>Write a Review</div>
          </LWTooltip>}/>
      </div>
    </ContentStyles>
  </div>
}

export default registerComponent('PostNominatedNotification', PostNominatedNotification, {styles});


