import React from 'react';
import { useSingle } from '../../lib/crud/withSingle';
import { forumTitleSetting } from '../../lib/instanceSettings';
import { REVIEW_NAME_IN_SITU, REVIEW_YEAR } from '../../lib/reviewUtils';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { POST_PREVIEW_WIDTH } from '../posts/PostsPreviewTooltip/helpers';
import { notificationLoadingStyles } from '../posts/PostsPreviewTooltip/PostsPreviewLoading';

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

const PostNominatedNotificationInner = ({classes, postId}: {classes: ClassesType<typeof styles>, postId: string}) => {

  const { Loading, PostsTitle, ReviewPostButton, LWTooltip, ContentStyles } = Components

  const { document: post, loading } = useSingle({
    collectionName: "Posts",
    fragmentName: 'PostsList',
    fetchPolicy: 'cache-then-network' as any, //TODO
    documentId: postId
  });

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

export const PostNominatedNotification = registerComponent('PostNominatedNotification', PostNominatedNotificationInner, {styles});

declare global {
  interface ComponentTypes {
    PostNominatedNotification: typeof PostNominatedNotification
  }
}
