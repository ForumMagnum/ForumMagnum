import { Components, registerComponent } from '../../../lib/vulcan-lib';
import React from 'react';
import { QueryLink } from '../../../lib/reactRouterWrapper';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...theme.typography.contentNotice,
    ...theme.typography.postStyle
  },
})

interface PostsRevisionMessageFragment {
  contents: { editedAt: Date } | null
}

const PostsRevisionMessage = ({post, classes}: {
  post: PostsRevisionMessageFragment|PostsList,
  classes: ClassesType,
}) => {
  if (!post.contents )
    return null;
  if (!("editedAt" in post.contents))
    return null;

  const { FormatDate } = Components
  return (
    <div className={classes.root}>
      You are viewing a version of this post published on the <FormatDate date={post.contents.editedAt} format="Do MMM YYYY"/>.
      {" "}
      <QueryLink query={{revision: undefined}}>This link</QueryLink> will always display the most recent version of the post.
    </div>
  );
}

const PostsRevisionMessageComponent = registerComponent('PostsRevisionMessage', PostsRevisionMessage, {styles});

declare global {
  interface ComponentTypes {
    PostsRevisionMessage: typeof PostsRevisionMessageComponent
  }
}
