import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import { CommentTreeOptions } from '../comments/commentTree';
import NoContent from "@/components/common/NoContent";
import PostsItemNewCommentsListNode from "@/components/posts/PostsItemNewCommentsListNode";

const styles = (theme: ThemeType) => ({})

const PostsItemNewCommentsList = ({ terms, post, treeOptions }: {
  terms: CommentsViewTerms,
  classes: ClassesType<typeof styles>,
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

export default PostsItemNewCommentsListComponent;
