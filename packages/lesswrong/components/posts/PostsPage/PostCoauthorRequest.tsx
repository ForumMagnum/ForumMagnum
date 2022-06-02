import React, { useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import { Components, registerComponent, getFragment } from '../../../lib/vulcan-lib';
import { useCurrentUser } from '../../common/withUser';

const styles = (theme: ThemeType): JssStyles => ({
  coauthorRequest: {
    border: theme.palette.border.grey400,
    fontFamily: theme.palette.fonts.sansSerifStack,
    padding: '12px 18px',
  },
  content: {
    display: 'flex',
  },
  message: {
    flexGrow: 1,
  },
  accept: {
    cursor: 'pointer',
    padding: '8px',
    fontFamily: theme.typography.commentStyle.fontFamily,
    fontSize: 16,
    fontWeight: 500,
    color: theme.palette.secondary.main,
    '&:hover': {
      background: theme.palette.buttons.hoverGrayHighlight,
    },
  },
  error: {
    marginTop: '10px',
    color: theme.palette.text.error2,
  },
});

const isRequestedCoauthor = (
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  currentUser: UsersCurrent|null
) => currentUser &&
    post.pendingCoauthorUserIds &&
    post.pendingCoauthorUserIds.includes(currentUser._id);

const PostCoauthorRequest = ({post, currentUser, classes}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  currentUser: UsersCurrent|null,
  classes: ClassesType,
}) => {
  const [error, setError] = useState<string|undefined>();
  const [loading, setLoading] = useState(false);

  const [acceptCoauthorRequest] = useMutation(gql`
    mutation AcceptCoauthorRequest($postId: String, $userId: String) {
        acceptCoauthorRequest(postId: $postId, userId: $userId) {
          ...PostsDetails
        }
    }
    ${getFragment('PostsDetails')}
  `)

  if (!isRequestedCoauthor(post, currentUser)) {
    return null;
  }

  const onAccept = async () => {
    setLoading(true);
    const { errors } = await acceptCoauthorRequest({variables: {
      postId: post._id,
      userId: currentUser?._id,
    }});
    if (errors) {
      setError(`Oops, something went wrong: ${errors[0].message}`);
    }
    setLoading(false);
  }

  const { Typography, LWTooltip, Loading } = Components;
  return (
    <div className={classes.coauthorRequest}>
      <div className={classes.content}>
        <Typography variant='body2' className={classes.message}>
          {post.user?.displayName ?? 'The author'} has requested you to co-author this post
        </Typography>
        {loading
          ? <Loading />
          : (
            <LWTooltip title='Become an author of this post' placement='bottom'>
              <span className={classes.accept} onClick={onAccept}>Accept</span>
            </LWTooltip>
          )
        }
      </div>
      {error && <div className={classes.error}>{error}</div>}
    </div>
  );
}

const PostCoauthorRequestComponent = registerComponent(
  'PostCoauthorRequest', PostCoauthorRequest, {styles}
);

declare global {
  interface ComponentTypes {
    PostCoauthorRequest: typeof PostCoauthorRequestComponent,
  }
}
