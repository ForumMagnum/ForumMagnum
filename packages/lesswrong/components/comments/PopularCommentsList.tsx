import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useMulti } from "../../lib/crud/withMulti";
import { ExpandedDate } from "../common/FormatDate";
import { Link } from "../../lib/reactRouterWrapper";
import { postGetPageUrl } from "../../lib/collections/posts/helpers";
import { commentGetPageUrl } from "../../lib/collections/comments/helpers";
import moment from "moment";
import { Comments } from "../../lib/collections/comments";
import { htmlToTextDefault } from "../../lib/htmlToText";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 500,
    color: theme.palette.grey[1000],
  },
  item: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    background: theme.palette.grey[0],
    borderRadius: theme.borderRadius.default,
    border: `1px solid ${theme.palette.grey[200]}`,
    padding: "8px 12px",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  post: {
    color: theme.palette.grey[600],
    fontWeight: 600,
  },
  link: {
    color: theme.palette.primary.main,
    fontWeight: 600,
    "&:hover": {
      opacity: 1,
      color: theme.palette.primary.light,
    },
  },
  username: {
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  date: {
    color: theme.palette.grey[600],
  },
  body: {
    lineHeight: "160%",
    letterSpacing: "-0.14px",
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 2,
  },
});

const PopularCommentsList = ({classes}: {classes: ClassesType}) => {
  const {loading, loadMoreProps, results} = useMulti({
    terms: {view: "frontpagePopular"},
    collectionName: "Comments",
    fragmentName: "CommentsListWithParentMetadata",
    enableTotal: false,
    limit: 3,
  });

  const {Loading, LoadMore, UsersName, LWTooltip, SmallSideVote} = Components;
  if (loading) {
    return (
      <Loading />
    );
  }

  return (
    <div className={classes.root}>
      {results?.map((comment) => (
        <div className={classes.item}>
          {comment.post &&
            <div className={classes.row}>
              <Link to={postGetPageUrl(comment.post)} className={classes.post}>
                {comment.post?.title}
              </Link>
              <Link to={commentGetPageUrl(comment)} className={classes.link}>
                View in thread
              </Link>
            </div>
          }
          <div className={classes.row}>
            <UsersName user={comment.user} className={classes.username} />
            <div className={classes.date}>
              <LWTooltip
                placement="right"
                title={<ExpandedDate date={comment.postedAt} />}
              >
                {moment(new Date(comment.postedAt)).fromNow()}
              </LWTooltip>
            </div>
            {!comment.debateResponse && !comment.rejected &&
              <SmallSideVote
                document={comment}
                collection={Comments}
                hideKarma={comment.post?.hideCommentKarma}
              />
            }
          </div>
          <div className={classes.body}>
            {htmlToTextDefault(comment.contents?.html)}
          </div>
        </div>
      ))}
      <LoadMore {...loadMoreProps} />
    </div>
  );
}

const PopularCommentsListComponent = registerComponent(
  "PopularCommentsList",
  PopularCommentsList,
  {styles},
);

declare global {
  interface ComponentTypes {
    PopularCommentsList: typeof PopularCommentsListComponent
  }
}
