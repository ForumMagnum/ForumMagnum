import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib/components';
import { useSingle } from '../../lib/crud/withSingle';
import { Link } from '../../lib/reactRouterWrapper';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    padding: 16,
    ...theme.typography.commentStyles,
    ...theme.typography.body2,
    maxWidth: 600,
  },
});

const CommentOnYourDraftNotificationHover = ({notification, classes}: {
  notification: NotificationsList,
  classes: ClassesType
}) => {
  const { UsersName, Loading } = Components;
  const postId = notification.documentId;
  const postEditUrl = `/editPost?postId=${postId}`
  const { document: post, loading: loadingPost } = useSingle({
    documentId: postId,
    collectionName: "Posts",
    fragmentName: "PostsMinimumInfo",
  });
  
  const senderUserId = notification.extraData?.senderUserID;
  
  return <div className={classes.root}>
    <div>
      {senderUserId ? <UsersName documentId={notification.extraData.senderUserID}/> : "Someone"}
      {" commented on your draft "}
      <Link to={postEditUrl}>
        {post ? post.title : <Loading/>}
      </Link>
    </div>
    
    {notification.extraData && <blockquote dangerouslySetInnerHTML={{__html: notification.extraData.commentHtml}}/>}
  </div>
}

const CommentOnYourDraftNotificationHoverComponent = registerComponent('CommentOnYourDraftNotificationHover', CommentOnYourDraftNotificationHover, {styles});

declare global {
  interface ComponentTypes {
    CommentOnYourDraftNotificationHover: typeof CommentOnYourDraftNotificationHoverComponent
  }
}
