"use client";

import React from "react";
import { gql } from "@/lib/generated/gql-codegen";
import { useQuery } from "@/lib/crud/useQuery";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { Link } from "@/lib/reactRouterWrapper";
import moment from "moment";
import classNames from "classnames";

const UserTopPostsQuery = gql(`
  query UserTopPostsForManager($selector: PostSelector, $limit: Int) {
    posts(selector: $selector, limit: $limit) {
      results {
        ...PostsList
      }
    }
  }
`);

const styles = defineStyles("TopPostsManager", (theme: ThemeType) => ({
  root: {
    marginBottom: theme.spacing.unit * 3,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.unit * 2,
  },
  title: {
    fontSize: "1rem",
    fontWeight: 600,
    color: theme.palette.grey[800],
  },
  restoreButton: {
    padding: "6px 12px",
    fontSize: "0.875rem",
    color: theme.palette.grey[600],
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: 4,
    background: "white",
    cursor: "not-allowed",
    opacity: 0.5,
    "&:enabled": {
      cursor: "pointer",
      opacity: 1,
      "&:hover": {
        background: theme.palette.grey[50],
      },
    },
  },
  postList: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing.unit,
  },
  postRow: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing.unit * 1.5,
  },
  postItem: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing.unit * 1.5,
    padding: theme.spacing.unit * 1.5,
    border: theme.palette.border.grey300,
    borderRadius: 6,
    background: theme.palette.background.pageActiveAreaBackground,
    flex: 1,
  },
  postNumber: {
    fontSize: "0.875rem",
    fontWeight: 600,
    color: theme.palette.grey[500],
    minWidth: 16,
    textAlign: "center",
    flexShrink: 0,
  },
  dragHandle: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    cursor: "grab",
    "& > span": {
      width: 4,
      height: 4,
      borderRadius: "50%",
      background: theme.palette.grey[400],
    },
  },
  postContent: {
    flex: 1,
    minWidth: 0,
  },
  postTitle: {
    fontSize: "0.9375rem",
    fontWeight: 500,
    color: theme.palette.text.normal,
    textDecoration: "none",
    "&:hover": {
      color: theme.palette.primary.main,
    },
  },
  postMeta: {
    fontSize: "0.8125rem",
    color: theme.palette.grey[600],
    marginTop: 2,
  },
  swapButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: 4,
    background: "white",
    cursor: "pointer",
    flexShrink: 0,
    "&:hover": {
      background: theme.palette.grey[50],
      borderColor: theme.palette.grey[400],
    },
  },
  swapIcon: {
    width: 16,
    height: 16,
    "& path": {
      stroke: theme.palette.grey[600],
    },
  },
}));

const SwapIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6L8 2L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 10L8 14L12 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DragHandle = ({ classes }: { classes: ClassesType<typeof styles> }) => (
  <div className={classes.dragHandle}>
    <span />
    <span />
    <span />
    <span />
    <span />
    <span />
  </div>
);

export const TopPostsManager = ({ userId }: { userId: string }) => {
  const classes = useStyles(styles);

  const { data, loading } = useQuery(UserTopPostsQuery, {
    variables: { 
      selector: userId ? { 
        drafts: { userId, includeArchived: false }
      } : undefined,
      limit: 50,
    },
    skip: !userId,
    fetchPolicy: "network-only",
  });

  if (loading) {
    return null;
  }

  // TODO: Switch to published posts once query is fixed
  const allPosts = data?.posts?.results ?? [];
  const postCount = allPosts.length;

  // Don't show if user has 0-1 posts (nothing to manage)
  if (postCount <= 1) {
    return null;
  }

  const hasCustomization = false;

  // For 2-4 posts, show all posts (no swap buttons)
  // For 5+ posts, show top 4 with swap buttons
  const postsToShow = postCount <= 4 ? allPosts.slice(0, postCount) : allPosts.slice(0, 4);
  const showSwapButtons = postCount >= 5;

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <div className={classes.title}>Swap top posts</div>
        <button
          className={classes.restoreButton}
          disabled={!hasCustomization}
          onClick={() => {
            // TODO: Wire up restore defaults functionality
            console.log("Restore defaults clicked");
          }}
        >
          Restore defaults
        </button>
      </div>
      <div className={classes.postList}>
        {postsToShow.map((post, index) => (
          <div key={post._id} className={classes.postRow}>
            <div className={classes.postNumber}>{index + 1}</div>
            <div className={classes.postItem}>
              <DragHandle classes={classes} />
            <div className={classes.postContent}>
              <Link to={postGetPageUrl(post)} className={classes.postTitle}>
                {post.title}
              </Link>
              <div className={classes.postMeta}>
                {post.baseScore} · {moment(new Date(post.postedAt)).fromNow()}
              </div>
            </div>
            {showSwapButtons && (
              <button
                className={classes.swapButton}
                onClick={() => {
                  // TODO: Wire up swap functionality
                  console.log(`Swap button clicked for post ${index + 1}`);
                }}
                type="button"
              >
                <SwapIcon />
              </button>
            )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
