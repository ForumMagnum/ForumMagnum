import React from 'react'
import { useCurrentUser } from '../../common/withUser';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { postCoauthorIsPending } from '../../../lib/collections/posts/helpers';

const PostsCoauthor = ({ post, coauthor }: {
  post: PostsDetails,
  coauthor: UsersMinimumInfo,
}) => {
  const isPending = postCoauthorIsPending(post, coauthor._id);

  const currentUser = useCurrentUser();
  if (isPending && currentUser?._id !== post.userId) {
    return null;
  }

  const { UsersNamePending, UsersName } = Components;
  const Component = isPending ? UsersNamePending : UsersName;
  return (
    <span>
      , <Component user={coauthor} />
    </span>
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
