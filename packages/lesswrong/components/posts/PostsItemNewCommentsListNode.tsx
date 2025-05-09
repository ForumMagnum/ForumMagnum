import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { unflattenComments } from '../../lib/utils/unflatten';
import { CommentTreeOptions } from '../comments/commentTree';
import { Loading } from "../vulcan-core/Loading";
import { CommentsList } from "../comments/CommentsList";

const styles = (theme: ThemeType) => ({
  title: {
    fontSize: 10,
    ...theme.typography.commentStyle,
    color: theme.palette.text.dim700,
    marginBottom: 4
  }
})

const PostsItemNewCommentsListNodeInner = ({ commentsList, loadingState, title, reverseOrder, post, treeOptions, classes }: {
  commentsList?: CommentsList[],
  loadingState: boolean,
  title?: string,
  reverseOrder?: boolean
  post: PostsList,
  treeOptions: CommentTreeOptions,
  classes: ClassesType<typeof styles>,
}) => {
  const lastCommentId = commentsList && commentsList[0]?._id
  const nestedComments = commentsList && unflattenComments(commentsList);

  if (reverseOrder) {
    nestedComments?.sort((a, b) => new Date(a.item.postedAt).getTime() - new Date(b.item.postedAt).getTime());
  }

  return (
    <div>
      {title && <div className={classes.title}>{title}</div>}
      {nestedComments && <CommentsList
        treeOptions={{
          ...treeOptions,
          lastCommentId: lastCommentId,
          post: post,
        }}
        comments={nestedComments}
        startThreadTruncated={true}
      />}
      {loadingState && <Loading/>}
    </div>
  );
};

export const PostsItemNewCommentsListNode = registerComponent(
  'PostsItemNewCommentsListNode', PostsItemNewCommentsListNodeInner, {
    styles,
  }
);


