import React, { useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import { Components, registerComponent, getFragment } from '../../../lib/vulcan-lib';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  coauthorRequest: {
    border: theme.palette.border.grey400,
    fontFamily: theme.palette.fonts.sansSerifStack,
    padding: '12px 18px',
    marginBottom: '30px',
  },
  content: {
    display: 'flex',
    alignItems: 'center',
  },
  message: {
    flexGrow: 1,
  },
  button: {
    cursor: 'pointer',
    padding: '8px',
    fontFamily: theme.typography.commentStyle.fontFamily,
    fontSize: 16,
    fontWeight: 500,
    '&:hover': {
      background: theme.palette.buttons.hoverGrayHighlight,
    },
  },
  decline: {
    color: theme.palette.text.error2,
  },
  accept: {
    color: theme.palette.secondary.main,
  },
  error: {
    marginTop: '10px',
    color: theme.palette.text.error2,
  },
});

const isRequestedCoauthor = (
  post: PostsWithNavigation|PostsWithNavigationAndRevision|PostsList,
  currentUser: UsersCurrent|null
) => currentUser && post.coauthorStatuses?.find?.(({ userId, confirmed }) => userId === currentUser._id && !confirmed);

const PostCoauthorRequest = ({post, currentUser, classes}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision|PostsList,
  currentUser: UsersCurrent|null,
  classes: ClassesType,
}) => {
  const [error, setError] = useState<string|undefined>();
  const [loading, setLoading] = useState(false);

  const [acceptCoauthorRequest] = useMutation(gql`
    mutation AcceptCoauthorRequest($postId: String, $userId: String, $accept: Boolean) {
        acceptCoauthorRequest(postId: $postId, userId: $userId, accept: $accept) {
          ...PostsDetails
        }
    }
    ${getFragment('PostsDetails')}
  `)

  if (!isRequestedCoauthor(post, currentUser)) {
    return null;
  }

  const onResponse = async (accept: boolean) => {
    setLoading(true);
    const { errors } = await acceptCoauthorRequest({variables: {
      postId: post._id,
      userId: currentUser?._id,
      accept,
    }});
    if (errors) {
      setError(`Oops, something went wrong: ${errors[0].message}`);
    }
    setLoading(false);
  }

  const onDecline = () => onResponse(false);
  const onAccept = () => onResponse(true);

  const { Typography, Loading } = Components;
  return (
    <div className={classes.coauthorRequest}>
      <div className={classes.content}>
        <Typography variant='body2' className={classes.message}>
          {post.user?.displayName ?? 'The author'} has requested you to become a co-author of this post
        </Typography>
        {loading
          ? <Loading />
          : (
            <>
              <span className={classNames(classes.button, classes.decline)} onClick={onDecline}>
                Decline
              </span>
              <span className={classNames(classes.button, classes.accept)} onClick={onAccept}>
                Accept
              </span>
            </>
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
