import React from 'react';
import { Components, registerComponent} from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { CommentTreeOptions } from '../comments/commentTree';

const styles = (theme: ThemeType): JssStyles => ({})

const PostsItemNewCommentsList = ({ terms, post, treeOptions }: {
  terms: CommentsViewTerms,
  classes: ClassesType,
  post: PostsList,
  treeOptions: CommentTreeOptions,
}) => {
  const { loading, results } = useMulti({
    terms,
    collectionName: "Comments",
    fragmentName: 'CommentsList',
    fetchPolicy: 'cache-first',
    limit: 5,
  });

  const { NoContent, PostsItemNewCommentsListNode } = Components

  const noCommentsFound = !loading && results && !results.length;

  if (noCommentsFound) {
    return <NoContent>No comments found</NoContent>
  }
  
  else {
    const props: React.ComponentProps<typeof PostsItemNewCommentsListNode> = {
      commentsList: results,
      loadingState: loading,
      post,
      treeOptions
    };

    return <PostsItemNewCommentsListNode {...props} />;
  }
};

const PostsItemNewCommentsListComponent = registerComponent(
  'PostsItemNewCommentsList', PostsItemNewCommentsList, {
    styles,
  }
);

declare global {
  interface ComponentTypes {
    PostsItemNewCommentsList: typeof PostsItemNewCommentsListComponent
  }
}
