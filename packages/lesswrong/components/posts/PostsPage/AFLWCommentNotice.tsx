"use client";
import React from 'react';
import { useCurrentUser } from '../../common/withUser';
import { isAF } from '@/lib/instanceSettings';
import { useQuery } from '@/lib/crud/useQuery';
import { CommentsListMultiQuery } from '../queries';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('AFLWCommentNotice', (theme: ThemeType) => ({
  root: {
    padding: '8px 12px',
    marginBottom: 12,
    border: theme.palette.border.commentBorder,
    borderRadius: 3,
    backgroundColor: theme.palette.panelBackground.darken05,
    fontSize: '0.9em',
    color: theme.palette.text.dim3,
  },
  link: {
    color: theme.palette.primary.main,
    textDecoration: 'underline',
  },
}));

const AFLWCommentNotice = ({ post }: { post: PostsWithNavigation | PostsWithNavigationAndRevision }) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();

  const { data } = useQuery(CommentsListMultiQuery, {
    variables: {
      selector: { postLWComments: { postId: post._id, userId: currentUser?._id } },
      limit: 5,
    },
    skip: !isAF() || !currentUser,
  });

  if (!isAF() || !currentUser) return null;

  const hasLWComment = data?.comments?.results?.some(c => !c.af);
  if (!hasLWComment) return null;

  const lwURL = `https://www.lesswrong.com/posts/${post._id}/${post.slug}`;

  return (
    <div className={classes.root}>
      You have a comment on the{' '}
      <a href={lwURL} target="_blank" rel="noreferrer" className={classes.link}>
        LessWrong version of this post
      </a>
      {' '}that is not visible here on the Alignment Forum.
    </div>
  );
};

export default AFLWCommentNotice;
