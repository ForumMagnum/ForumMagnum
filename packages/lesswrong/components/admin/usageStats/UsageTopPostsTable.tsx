"use client";

import React from "react";
import classNames from "classnames";
import { Link } from "../../../lib/reactRouterWrapper";
import { defineStyles, useStyles } from "../../hooks/useStyles";

/**
 * "Top posts" breakdown panel, modeled on the ai-2030 analytics dashboard's
 * BreakdownTable: each row carries a faint proportional bar behind the label
 * so relative magnitude reads at a glance without a chart.
 */

const styles = defineStyles("UsageTopPostsTable", (theme: ThemeType) => ({
  root: {
    border: theme.palette.border.normal,
    background: theme.palette.panelBackground.default,
    padding: 16,
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  title: {
    margin: "0 0 12px 0",
    fontSize: 13,
    fontWeight: 600,
    color: theme.palette.text.normal,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 12,
  },
  headerCell: {
    padding: "2px 8px",
    textAlign: "right",
    fontWeight: 500,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.03em",
    color: theme.palette.grey[500],
    whiteSpace: "nowrap",
  },
  headerCellLabel: {
    textAlign: "left",
    width: "100%",
  },
  row: {
    "&:hover": {
      background: theme.palette.panelBackground.darken03,
    },
  },
  labelCell: {
    position: "relative",
    maxWidth: 0,
    width: "100%",
    padding: "3px 8px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  labelBar: {
    position: "absolute",
    top: 2,
    bottom: 2,
    left: 0,
    background: `${theme.palette.primary.main}1a`,
  },
  labelText: {
    position: "relative",
  },
  postLink: {
    color: theme.palette.text.normal,
    "&:hover": {
      color: theme.palette.primary.dark,
    },
  },
  deletedPost: {
    color: theme.palette.grey[500],
    fontStyle: "italic",
  },
  numberCell: {
    padding: "3px 8px",
    textAlign: "right",
    fontVariantNumeric: "tabular-nums",
    whiteSpace: "nowrap",
    color: theme.palette.text.normal,
  },
  shareCell: {
    color: theme.palette.grey[600],
  },
  emptyMessage: {
    fontSize: 12,
    color: theme.palette.grey[600],
  },
}));

export interface UsageTopPost {
  postId: string;
  title: string | null;
  slug: string | null;
  views: number;
  uniqueViews: number;
}

const UsageTopPostsTable = ({
  posts,
  totalViews,
}: {
  posts: UsageTopPost[];
  /** All pageviews in the range — the denominator for each row's share. */
  totalViews: number;
}) => {
  const classes = useStyles(styles);

  if (!posts.length) {
    return (
      <section className={classes.root}>
        <h2 className={classes.title}>Top posts</h2>
        <div className={classes.emptyMessage}>No post views in this range.</div>
      </section>
    );
  }

  const maxViews = Math.max(1, ...posts.map(({ views }) => views));

  return (
    <section className={classes.root}>
      <h2 className={classes.title}>Top posts</h2>
      <table className={classes.table}>
        <thead>
          <tr>
            <th className={classNames(classes.headerCell, classes.headerCellLabel)}>Post</th>
            <th className={classes.headerCell}>Views</th>
            <th className={classes.headerCell}>Unique viewers</th>
            <th className={classes.headerCell}>% of views</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.postId} className={classes.row}>
              <td className={classes.labelCell}>
                <div
                  className={classes.labelBar}
                  style={{ width: `${(post.views / maxViews) * 100}%` }}
                />
                <span className={classes.labelText}>
                  {post.title ? (
                    <Link
                      to={`/posts/${post.postId}/${post.slug ?? ""}`}
                      className={classes.postLink}
                    >
                      {post.title}
                    </Link>
                  ) : (
                    // The analytics DB remembers views of posts that have since
                    // been deleted or hidden from this user.
                    <span className={classes.deletedPost}>
                      [inaccessible post {post.postId}]
                    </span>
                  )}
                </span>
              </td>
              <td className={classes.numberCell}>{post.views.toLocaleString()}</td>
              <td className={classes.numberCell}>{post.uniqueViews.toLocaleString()}</td>
              <td className={classNames(classes.numberCell, classes.shareCell)}>
                {totalViews > 0 ? `${((post.views / totalViews) * 100).toFixed(1)}%` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};

export default UsageTopPostsTable;
