import React from 'react';
import { Components, registerComponent} from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { unflattenComments } from '../../lib/utils/unflatten';
import { CommentTreeOptions } from '../comments/commentTree';

const styles = (theme: ThemeType): JssStyles => ({
  title: {
    fontSize: 10,
    ...theme.typography.commentStyle,
    color: theme.palette.text.dim700,
    marginBottom: 4
  }
})

const PostsItemNewCommentsWrapper = ({ terms, classes, title, post, treeOptions }: {
  terms: CommentsViewTerms,
  classes: ClassesType,
  title?: string,
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
  const { Loading, CommentsList, NoContent } = Components

  if (!loading && results && !results.length) {
    return <NoContent>No comments found</NoContent>
  } 
  
  else {
    const lastCommentId = results && results[0]?._id
    let nestedComments = results && unflattenComments(results);
    if (post.debate) {
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
        {loading && <Loading/>}
      </div>
    );
  }
};

const PostsItemNewCommentsWrapperComponent = registerComponent(
  'PostsItemNewCommentsWrapper', PostsItemNewCommentsWrapper, {
    styles,
  }
);

declare global {
  interface ComponentTypes {
    PostsItemNewCommentsWrapper: typeof PostsItemNewCommentsWrapperComponent
  }
}
