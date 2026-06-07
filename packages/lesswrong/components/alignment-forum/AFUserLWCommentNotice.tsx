import React from "react";
import ContentStyles from "../common/ContentStyles";
import { useCurrentUser } from "../common/withUser";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import { defineStyles } from "@/components/hooks/defineStyles";
import { useStyles } from "@/components/hooks/useStyles";

const UserPostLWCommentsQuery = gql(`
  query AFUserLWCommentNotice($selector: CommentSelector, $limit: Int) {
    comments(selector: $selector, limit: $limit) {
      results {
        _id
      }
    }
  }
`);

const styles = defineStyles("AFUserLWCommentNotice", (theme: ThemeType) => ({
  root: {
    fontWeight: 400,
    margin: "0 auto 1.3em auto",
    border: theme.palette.border.commentBorder,
    borderRadius: 3,
    padding: 12,
  },
  viewLink: {
    marginLeft: 4,
  },
}));

const AFUserLWCommentNotice = ({ post }: {
  post: PostsBase,
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();

  const { data, loading } = useQuery(UserPostLWCommentsQuery, {
    variables: {
      selector: {
        userPostLWComments: {
          postId: post._id,
          userId: currentUser?._id,
        },
      },
      limit: 1,
    },
    skip: !currentUser,
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });

  const commentId = data?.comments?.results?.[0]?._id;
  if (loading || !commentId) {
    return null;
  }

  return (
    <ContentStyles contentType="comment" className={classes.root}>
      You have a LessWrong comment on this post that is not shown on the Alignment Forum.{" "}
      <a
        href={`https://www.lesswrong.com/posts/${post._id}/${post.slug}#${commentId}`}
        className={classes.viewLink}
      >
        View it on LessWrong.
      </a>
    </ContentStyles>
  );
};

export default AFUserLWCommentNotice;
