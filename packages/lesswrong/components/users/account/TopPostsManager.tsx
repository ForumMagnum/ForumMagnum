"use client";

import React, { useState, useCallback } from "react";
import { gql } from "@/lib/generated/gql-codegen";
import { useQuery } from "@/lib/crud/useQuery";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import moment from "moment";
import classNames from "classnames";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  MouseSensor,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";


const UserTopPostsQuery = gql(`
  query UserTopPostsForManager($selector: PostSelector, $limit: Int) {
    posts(selector: $selector, limit: $limit) {
      results {
        ...PostsList
      }
    }
  }
`);

interface PostItem {
  _id: string;
  title: string;
  baseScore: number;
  postedAt: string;
}

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
    padding: "6px 16px",
    position: "relative" as const,
    top: 5,
    fontSize: "0.8125rem",
    fontFamily: theme.typography.fontFamily,
    fontWeight: 500,
    letterSpacing: "0.02857em",
    textTransform: "uppercase" as const,
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
    padding: `${theme.spacing.unit}px ${theme.spacing.unit * 1.5}px`,
    border: `1px solid ${theme.palette.grey[400]}`,
    borderRadius: 6,
    background: theme.palette.background.pageActiveAreaBackground,
    flex: 1,
  },
  postItemDragging: {},
  postItemPlaceholder: {},
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
    justifyContent: "space-between",
    height: 24,
    cursor: "grab",
    padding: "2px 4px",
    borderRadius: 3,
    touchAction: "none",
    "& > span": {
      width: 3,
      height: 3,
      borderRadius: "50%",
      background: theme.palette.greyAlpha(0.25),
    },
    "&:hover > span": {
      background: theme.palette.greyAlpha(0.55),
    },
  },
  dragHandleActive: {
    cursor: "grabbing",
    "& > span": {
      background: theme.palette.greyAlpha(0.55),
    },
  },
  postContent: {
    flex: 1,
    minWidth: 0,
    cursor: "pointer",
    "&:hover + button": {
      backgroundColor: `color-mix(in srgb, ${theme.palette.primary.main} 8%, transparent)`,
    },
  },
  postTitle: {
    fontSize: "1.0625rem",
    fontWeight: 500,
    color: theme.palette.text.normal,
  },
  postMeta: {
    fontSize: "0.8125rem",
    color: "light-dark(#9a9189, #9a9189)",
    marginTop: 2,
  },
  swapButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    border: `1px solid ${theme.palette.primary.main}`,
    borderRadius: 4,
    background: "transparent",
    cursor: "pointer",
    flexShrink: 0,
    transition: "background 0.15s",
    "&:hover": {
      background: `rgba(${theme.palette.primary.main}, 0.04)`,
      // MUI outlined secondary hover uses a faint tint of the color
      backgroundColor: `color-mix(in srgb, ${theme.palette.primary.main} 8%, transparent)`,
    },
  },
  swapIcon: {
    width: 16,
    height: 16,
    color: theme.palette.primary.main,
  },
}));

const SwapIcon = ({ classes }: { classes: ClassesType<typeof styles> }) => (
  <svg className={classes.swapIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 7.5L8 7.5M21 7.5L16.6667 3M21 7.5L16.6667 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 16.5L17 16.5M4 16.5L8.33333 21M4 16.5L8.33333 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DragDots = () => (
  <>
    <span />
    <span />
    <span />
    <span />
    <span />
  </>
);

function SortablePostRow({
  post,
  index,
  showSwapButtons,
  activeDragId,
  classes,
}: {
  post: PostItem;
  index: number;
  showSwapButtons: boolean;
  activeDragId: string | null;
  classes: ClassesType<typeof styles>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: post._id });

  const cardStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    position: "relative" as const,
    flex: 1,
  };

  const isPlaceholder = activeDragId === post._id;

  return (
    <div className={classes.postRow}>
      <div className={classes.postNumber}>{index + 1}</div>
      <div
        ref={setNodeRef}
        style={cardStyle}
        className={classNames(classes.postItem, {
          [classes.postItemDragging]: isDragging,
          [classes.postItemPlaceholder]: isPlaceholder && !isDragging,
        })}
      >
        <div
          className={classNames(classes.dragHandle, { [classes.dragHandleActive]: isDragging })}
          {...attributes}
          {...listeners}
        >
          <DragDots />
        </div>
        <div className={classes.postContent}>
          <span className={classes.postTitle}>
            {post.title}
          </span>
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
            <SwapIcon classes={classes} />
          </button>
        )}
      </div>
    </div>
  );
}

export const TopPostsManager = ({ userId }: { userId: string }) => {
  const classes = useStyles(styles);
  const [orderedPostIds, setOrderedPostIds] = useState<string[] | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const mouse = useSensor(MouseSensor, { activationConstraint: { distance: 5 } });
  const pointer = useSensor(PointerSensor, { activationConstraint: { distance: 5 } });
  const keyboard = useSensor(KeyboardSensor);
  const sensors = useSensors(mouse, pointer, keyboard);

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

  // TODO: Switch to published posts once query is fixed
  const allPosts = data?.posts?.results ?? [];
  const postCount = allPosts.length;

  const hasCustomization = orderedPostIds !== null;

  // For 2-4 posts, show all posts (no swap buttons)
  // For 5+ posts, show top 4 with swap buttons
  const defaultPosts = postCount <= 4 ? allPosts.slice(0, postCount) : allPosts.slice(0, 4);
  const showSwapButtons = postCount >= 5;

  // Use custom order if set, otherwise default
  const postsToShow = orderedPostIds
    ? orderedPostIds.map(id => allPosts.find(p => p._id === id)).filter((p): p is NonNullable<typeof p> => !!p)
    : defaultPosts;

  const postIds = postsToShow.map(p => p._id);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const currentIds = orderedPostIds ?? postIds;
      const oldIndex = currentIds.indexOf(active.id as string);
      const newIndex = currentIds.indexOf(over.id as string);
      if (oldIndex !== -1 && newIndex !== -1) {
        setOrderedPostIds(arrayMove(currentIds, oldIndex, newIndex));
      }
    }
  }, [orderedPostIds, postIds]);

  const handleDragCancel = useCallback(() => {
    setActiveDragId(null);
  }, []);

  const handleRestoreDefaults = useCallback(() => {
    setOrderedPostIds(null);
  }, []);

  // Don't show if loading or user has 0-1 posts (nothing to manage)
  if (loading || postCount <= 1) {
    return null;
  }

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <div className={classes.title}>Swap top posts</div>
        <button
          className={classes.restoreButton}
          disabled={!hasCustomization}
          onClick={handleRestoreDefaults}
        >
          Restore defaults
        </button>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={postIds} strategy={verticalListSortingStrategy}>
          <div className={classes.postList}>
            {postsToShow.map((post, index) => (
              <SortablePostRow
                key={post._id}
                post={post}
                index={index}
                showSwapButtons={showSwapButtons}
                activeDragId={activeDragId}
                classes={classes}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
