import React from 'react'
import { useCurrentUserId } from '../../common/withUser';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { postCoauthorIsPending } from '../../../lib/collections/posts/helpers';
import { AUTHOR_MARKER_STYLES } from './PostsAuthors';
import UsersNamePending from "../../users/UsersNamePending";
import UsersName from "../../users/UsersName";
import UserCommentMarkers from "../../users/UserCommentMarkers";

const styles = (_: ThemeType) => ({
  markers: AUTHOR_MARKER_STYLES,
});

const PostsCoauthor = ({ post, coauthor, pageSectionContext, classes }: {
  post: PostsList,
  coauthor: UsersMinimumInfo,
  pageSectionContext?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUserId = useCurrentUserId();
  const isPending = postCoauthorIsPending(post, coauthor._id);
  if (
    currentUserId !== post.userId &&
    !post.coauthorStatuses?.find(({ userId }) => currentUserId === userId) &&
    isPending
  ) {
    return null;
  }
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

export default registerComponent(
  'PostsCoauthor',
  PostsCoauthor,
  {styles},
);


