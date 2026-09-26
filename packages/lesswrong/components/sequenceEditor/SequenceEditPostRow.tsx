import React from "react";
import classNames from "classnames";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import { defineStyles, useStyles } from "../hooks/useStyles";
import ForumIcon from "../common/ForumIcon";
import PostsTitle from "../posts/PostsTitle";
import type { DragHandleProps } from "../form-components/sortableList";
import SequenceEditMenu, { type SequenceEditMenuItem } from "./SequenceEditMenu";

const SequenceEditPostRowQuery = gql(`
  query SequenceEditPostRow($documentId: String) {
    post(input: { selector: { documentId: $documentId } }, allowNull: true) {
      result {
        ...PostsList
      }
    }
  }
`);

/** Rows are the same height as post rows in reading mode (48px). */
const styles = defineStyles("SequenceEditPostRow", (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    minHeight: 48,
    padding: "0 4px",
    borderBottom: theme.palette.border.itemSeparatorBottom,
    background: theme.palette.panelBackground.default,
    ...theme.typography.body2,
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  dragging: {
    opacity: 0.6,
    boxShadow: `0 2px 8px ${theme.palette.boxShadowColor(0.15)}`,
  },
  handle: {
    display: "flex",
    cursor: "grab",
    color: theme.palette.greyAlpha(0.35),
    touchAction: "none",
    padding: 2,
    border: "none",
    background: "none",
    "&:hover": {
      color: theme.palette.greyAlpha(0.7),
    },
  },
  handleIcon: {
    width: 18,
    height: 18,
  },
  karma: {
    minWidth: 32,
    fontSize: 13,
    color: theme.palette.greyAlpha(0.5),
    textAlign: "right",
  },
  title: {
    flexGrow: 1,
    minWidth: 0,
  },
  unavailable: {
    color: theme.palette.greyAlpha(0.5),
    fontStyle: "italic",
  },
  author: {
    fontSize: 13,
    color: theme.palette.greyAlpha(0.55),
    whiteSpace: "nowrap",
    [theme.breakpoints.down("xs")]: {
      display: "none",
    },
  },
  removeButton: {
    display: "flex",
    border: "none",
    background: "none",
    cursor: "pointer",
    padding: 2,
    borderRadius: 4,
    color: theme.palette.greyAlpha(0.4),
    "&:hover": {
      color: theme.palette.greyAlpha(0.85),
      background: theme.palette.greyAlpha(0.05),
    },
  },
  removeIcon: {
    width: 16,
    height: 16,
  },
}));

function useRowPost(postId: string, loadedPost: PostsList | undefined) {
  const { data, loading } = useQuery(SequenceEditPostRowQuery, {
    variables: { documentId: postId },
    skip: !!loadedPost,
    ssr: false,
  });
  return { post: loadedPost ?? data?.post?.result ?? undefined, loading: !loadedPost && loading };
}

/**
 * A post in the sequence editor: drag handle, karma, title, author, a menu of
 * moves (for when dragging is awkward), and a remove button. `loadedPost` is
 * the post if the chapter query already loaded it; otherwise it's fetched.
 */
const SequenceEditPostRow = ({ postId, loadedPost, dragHandleProps, isDragging, menuItems, onRemove }: {
  postId: string,
  loadedPost?: PostsList,
  dragHandleProps?: DragHandleProps,
  isDragging?: boolean,
  menuItems: SequenceEditMenuItem[],
  onRemove: () => void,
}) => {
  const classes = useStyles(styles);
  const { post, loading } = useRowPost(postId, loadedPost);

  return <div className={classNames(classes.root, isDragging && classes.dragging)}>
    <button
      className={classes.handle}
      ref={dragHandleProps?.ref}
      {...dragHandleProps?.attributes}
      {...dragHandleProps?.listeners}
      aria-label="Drag to reorder"
    >
      <ForumIcon icon="DragIndicator" className={classes.handleIcon} />
    </button>
    <span className={classes.karma}>{post?.baseScore ?? ""}</span>
    <span className={classNames(classes.title, !post && !loading && classes.unavailable)}>
      {post ? <PostsTitle post={post} isLink={false} showIcons={false} /> : (loading ? "Loading…" : "Unavailable post")}
    </span>
    {post?.user && <span className={classes.author}>{post.user.displayName}</span>}
    <SequenceEditMenu items={menuItems} label="Move post" />
    <button className={classes.removeButton} onClick={onRemove} aria-label="Remove from sequence" title="Remove from sequence">
      <ForumIcon icon="Close" className={classes.removeIcon} />
    </button>
  </div>;
};

export default SequenceEditPostRow;
