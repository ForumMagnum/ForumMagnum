import React from 'react';
import ContentStyles from '../common/ContentStyles';
import { useQuery } from "@/lib/crud/useQuery";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import { CommentsListMultiQuery } from '../posts/queries';
import { useCurrentUser } from '../common/withUser';

const styles = defineStyles("AFNonAfCommentNotice", (theme: ThemeType) => ({
  root: {
    fontWeight: 400,
    marginTop: 16,
    marginBottom: 16,
    display: "flex",
    justifyContent: "center",
    textAlign: "center",
  },
  link: {
    marginLeft: 4,
  }
}));

const AFNonAfCommentNotice = ({ post }: { post: PostsBase }) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();

  const { data, loading } = useQuery(CommentsListMultiQuery, {
    variables: {
      selector: { userNonAfPostComments: { postId: post._id, userId: currentUser?._id } },
      limit: 1,
      enableTotal: false,
    },
    skip: !currentUser,
    fetchPolicy: 'cache-and-network',
  });

  const hasNonAfComments = (data?.comments?.results?.length ?? 0) > 0;

  if (loading || !hasNonAfComments || !currentUser) return null;

  return (
    <ContentStyles contentType="comment" className={classes.root}>
      {"Your comment on this post isn't visible on the Alignment Forum because it hasn't been marked as AF-relevant."}
      <a href={`https://www.lesswrong.com/posts/${post._id}`} className={classes.link}>View it on LessWrong.</a>
    </ContentStyles>
  );
};

export default AFNonAfCommentNotice;
