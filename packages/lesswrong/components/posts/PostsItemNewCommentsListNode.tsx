import React from 'react';
import { Components, registerComponent} from '../../lib/vulcan-lib';
import { unflattenComments } from '../../lib/utils/unflatten';
import { CommentTreeOptions } from '../comments/commentTree';

const styles = (theme: ThemeType) => ({
  title: {
    fontSize: 10,
    ...theme.typography.commentStyle,
    color: theme.palette.text.dim700,
    marginBottom: 4
  }
})

const PostsItemNewCommentsListNode = ({ commentsList, loadingState, title, reverseOrder, post, treeOptions, classes }: {
  commentsList?: CommentsList[],
  loadingState: boolean,
  title?: string,
  reverseOrder?: boolean
  post: PostsList,
  treeOptions: CommentTreeOptions,
  classes: ClassesType<typeof styles>,
}) => {
  const { Loading, CommentsList } = Components

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

const PostsItemNewCommentsListNodeComponent = registerComponent(
  'PostsItemNewCommentsListNode', PostsItemNewCommentsListNode, {
    styles,
  }
);

declare global {
  interface ComponentTypes {
    PostsItemNewCommentsListNode: typeof PostsItemNewCommentsListNodeComponent
  }
}
