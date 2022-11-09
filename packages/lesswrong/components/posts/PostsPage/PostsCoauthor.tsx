import React from 'react'
import { useCurrentUser } from '../../common/withUser';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { postCoauthorIsPending } from '../../../lib/collections/posts/helpers';

const PostsCoauthor = ({ post, coauthor }: {
  post: PostsDetails,
  coauthor: UsersMinimumInfo,
}) => {
  const currentUser = useCurrentUser();
  const isPending = postCoauthorIsPending(post, coauthor._id);
  if (
    currentUser?._id !== post.userId &&
    !post.coauthorStatuses.find(({ userId }) => currentUser?._id === userId) &&
    isPending
  ) {
    return null;
  }

  const { UsersNamePending, UsersName } = Components;
  const Component = isPending
    ? UsersNamePending
    : UsersName;
  return (
    <>
      , <Component user={coauthor} />
    </>
  );
}

const PostsCoauthorComponent = registerComponent(
  'PostsCoauthor', PostsCoauthor
);

declare global {
  interface ComponentTypes {
    PostsCoauthor: typeof PostsCoauthorComponent
  }
}
