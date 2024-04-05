import React from 'react'
import { useCurrentUser } from '../../common/withUser';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { postCoauthorIsPending } from '../../../lib/collections/posts/helpers';
import { AUTHOR_MARKER_STYLES } from './PostsAuthors';

const styles = (_: ThemeType): JssStyles => ({
  markers: AUTHOR_MARKER_STYLES,
});

const PostsCoauthor = ({ post, coauthor, pageSectionContext, classes }: {
  post: PostsList,
  coauthor: UsersMinimumInfo,
  pageSectionContext?: string,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const isPending = postCoauthorIsPending(post, coauthor._id);
  if (
    currentUser?._id !== post.userId &&
    !post.coauthorStatuses?.find(({ userId }) => currentUser?._id === userId) &&
    isPending
  ) {
    return null;
  }

  const { UsersNamePending, UsersName, UserCommentMarkers } = Components;
  const Component = isPending
    ? UsersNamePending
    : UsersName;
  return (
    <>
      , <Component user={coauthor} pageSectionContext={pageSectionContext} />
      {!isPending && <UserCommentMarkers user={coauthor} className={classes.markers} />}
    </>
  );
}

const PostsCoauthorComponent = registerComponent(
  'PostsCoauthor',
  PostsCoauthor,
  {styles},
);

declare global {
  interface ComponentTypes {
    PostsCoauthor: typeof PostsCoauthorComponent
  }
}
