import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useSingle } from '../../lib/crud/withSingle';
import {useCurrentUser} from "../common/withUser";
import { NotifPopoverLink } from './useNotificationsPopoverContext';
import { UsersName } from "../users/UsersName";
import { Loading } from "../vulcan-core/Loading";

const styles = (theme: ThemeType) => ({
  root: {
    padding: 16,
    ...theme.typography.commentStyle,
    ...theme.typography.body2,
    maxWidth: 600,
  },
});

const CommentOnYourDraftNotificationHoverInner = ({notification, classes}: {
  notification: NotificationsList,
  classes: ClassesType<typeof styles>
}) => {
  const postId = notification.documentId ?? undefined;
  const postEditUrl = `/editPost?postId=${postId}`
  const currentUser = useCurrentUser()
  const { document: post, loading: loadingPost } = useSingle({
    documentId: postId,
    collectionName: "Posts",
    fragmentName: "PostsMinimumInfo",
    skip: !postId,
  });
  
  const senderUserId = notification.extraData?.senderUserID;
  
  const postOrDraft = post?.draft ? "draft" : "post";
  
  return <div className={classes.root}>
    <div>
      {senderUserId ? <UsersName documentId={notification.extraData.senderUserID}/> : "Someone"}
      {(currentUser?._id !== post?.userId) ? " replied to your comment on " : ` commented on your draft ${postOrDraft}`}
      <NotifPopoverLink to={postEditUrl}>
        {post ? post.title : <Loading/>}
      </NotifPopoverLink>
    </div>
    
    {notification.extraData && <blockquote dangerouslySetInnerHTML={{__html: notification.extraData.commentHtml}}/>}
  </div>
}

export const CommentOnYourDraftNotificationHover = registerComponent('CommentOnYourDraftNotificationHover', CommentOnYourDraftNotificationHoverInner, {styles});

declare global {
  interface ComponentTypes {
    CommentOnYourDraftNotificationHover: typeof CommentOnYourDraftNotificationHover
  }
}
