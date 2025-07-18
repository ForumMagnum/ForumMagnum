import { registerComponent } from '../../../lib/vulcan-lib/components';
import React from 'react';
import { QueryLink } from '../../../lib/reactRouterWrapper';
import FormatDate from "../../common/FormatDate";

const styles = (theme: ThemeType) => ({
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
  classes: ClassesType<typeof styles>,
}) => {
  if (!post.contents )
    return null;
  if (!("editedAt" in post.contents))
    return null;
  return (
    <div className={classes.root}>
      You are viewing a version of this post published on the <FormatDate date={post.contents.editedAt} format="Do MMM YYYY"/>.
      {" "}
      <QueryLink query={{revision: undefined}}>This link</QueryLink> will always display the most recent version of the post.
    </div>
  );
}

export default registerComponent('PostsRevisionMessage', PostsRevisionMessage, {styles});


