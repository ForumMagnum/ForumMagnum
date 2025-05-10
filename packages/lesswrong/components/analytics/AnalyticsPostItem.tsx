import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { postGetPageUrl } from "../../lib/collections/posts/helpers";
import { Link } from "../../lib/reactRouterWrapper";
import moment from "moment";
import type { PostAnalytics2Result } from "../hooks/useAnalytics";
import {
  gridColumns,
  mdTitleWidth,
  smTitleWidth,
  xsTitleWidth,
} from "./AuthorAnalyticsPage";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
    padding: "12px 4px 12px 12px",
    border: `1px solid ${theme.palette.grey[200]}`,
    borderRadius: theme.borderRadius.default,
    display: "grid",
    gridTemplateColumns: gridColumns(mdTitleWidth),
    alignItems: "center",
    [theme.breakpoints.down("sm")]: {
      gridTemplateColumns: gridColumns(smTitleWidth),
    },
    [theme.breakpoints.down("xs")]: {
      gridTemplateColumns: gridColumns(xsTitleWidth),
    },
  },
  postTitleCell: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  postTitle: {
    fontSize: 14,
    lineHeight: "22px",
    fontWeight: "600",
    paddingRight: 12,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  postSubtitle: {
    fontSize: 13,
    color: theme.palette.grey[700],
    fontWeight: 500,
  },
  valueCell: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
  },
  xsHide: {
    [theme.breakpoints.down("xs")]: {
      display: "none",
    },
  },
});

export const AnalyticsPostItemInner = ({post, className, classes}: {
  post: PostAnalytics2Result,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const timeFromNow = moment(new Date(post.postedAt)).fromNow();
  const ago = timeFromNow !== "now"
    ? <span className={classes.xsHide}>&nbsp;ago</span>
    : null;

  const postAnalyticsLink = `/postAnalytics?postId=${post._id}`;

  return (
    <div className={classNames(classes.root, className)}>
      <div className={classes.postTitleCell}>
        <div className={classes.postTitle}>
          <Link to={postGetPageUrl(post)}>{post.title}</Link>
        </div>
        <div className={classes.postSubtitle}>
          {timeFromNow}
          {ago}
          {" · "}
          <Link to={postAnalyticsLink}>View detailed stats</Link>
        </div>
      </div>
      <div className={classes.valueCell}>{post.views.toLocaleString()}</div>
      <div className={classes.valueCell}>{post.reads.toLocaleString()}</div>
      <div className={classes.valueCell}>{post.karma.toLocaleString()}</div>
      <div className={classes.valueCell}>{post.comments.toLocaleString()}</div>
    </div>
  );
}

export const AnalyticsPostItem = registerComponent(
  "AnalyticsPostItem",
  AnalyticsPostItemInner,
  {styles, stylePriority: -1},
);


