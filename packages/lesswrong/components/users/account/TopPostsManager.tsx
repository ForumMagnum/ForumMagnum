"use client";

import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
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
import { useMutation } from "@apollo/client/react";
import PopperCard from "@/components/common/PopperCard";
import type { Placement as PopperPlacementType } from "popper.js";
import { prettyScrollbars } from "@/themes/styleUtils";


const UserTopPostsQuery = gql(`
  query UserTopPostsForManager($selector: PostSelector, $limit: Int) {
    posts(selector: $selector, limit: $limit) {
      results {
        ...PostsList
      }
    }
  }
`);

const UpdatePinnedPostIdsMutation = gql(`
  mutation UpdatePinnedPostIds($selector: SelectorInput!, $data: UpdateUserDataInput!) {
    updateUser(selector: $selector, data: $data) {
      data {
        _id
        pinnedPostIds
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
    position: "relative",
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
    background: theme.palette.background.paper,
    cursor: "not-allowed",
    opacity: 0.5,
    "&:enabled": {
      cursor: "pointer",
      opacity: 1,
      border: `1px solid ${theme.palette.grey[500]}`,
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
    padding: `${theme.spacing.unit}px ${theme.spacing.unit * 1.5}px`,
    border: `1px solid ${theme.palette.grey[400]}`,
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
    alignItems: "center",
    alignSelf: "stretch",
    cursor: "grab",
    padding: `0 ${theme.spacing.unit * 1.5}px 0 4px`,
    marginLeft: -4,
    touchAction: "none",
    "&:hover span": {
      background: theme.palette.greyAlpha(0.55),
    },
  },
  dragHandleActive: {
    cursor: "grabbing",
    "& span": {
      background: theme.palette.greyAlpha(0.55),
    },
  },
  dragDots: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    height: 28,
    paddingTop: 1,
    paddingBottom: 1,
    "& > span": {
      width: 3,
      height: 3,
      borderRadius: "50%",
      background: theme.palette.greyAlpha(0.25),
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
    marginTop: 15,
  },
  postMeta: {
    fontSize: "0.8125rem",
    color: theme.palette.text.dim,
    marginTop: 3,
  },
  swapButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: theme.spacing.unit * 1.5,
    width: 32,
    height: 32,
    border: `1px solid ${theme.palette.primary.main}`,
    borderRadius: 4,
    background: "transparent",
    cursor: "pointer",
    flexShrink: 0,
    transition: "background 0.15s",
    "&:hover": {
      backgroundColor: `color-mix(in srgb, ${theme.palette.primary.main} 8%, transparent)`,
    },
  },
  swapButtonActive: {
    backgroundColor: `color-mix(in srgb, ${theme.palette.primary.main} 8%, transparent)`,
  },
  swapIcon: {
    width: 16,
    height: 16,
    color: theme.palette.primary.main,
  },

  searchDialog: {
    padding: `${theme.spacing.unit * 1.5}px`,
    border: `1px solid ${theme.palette.grey[400]}`,
    borderRadius: 6,
    boxShadow: "none",
    marginTop: -1,
    marginBottom: -1,
  },
  searchInput: {
    "&&, &&:focus": {
      width: "100%",
      padding: "10px 12px",
      fontSize: "0.9375rem",
      border: `1px solid ${theme.palette.grey[400]}`,
      borderRadius: 6,
      outline: "none",
      background: theme.palette.background.paper,
      fontFamily: theme.typography.fontFamily,
      marginBottom: theme.spacing.unit,
      "&::placeholder": {
        color: theme.palette.text.dim40,
        opacity: 1,
      },
    },
  },
  dialogPostList: {
    ...prettyScrollbars(theme),
    scrollbarColor: `${theme.palette.greyAlpha(0.1)} transparent`,
    "&::-webkit-scrollbar-thumb": {
      background: theme.palette.greyAlpha(0.1),
    },
    maxHeight: 120,
    margin: 0,
    padding: 0,
    listStyle: "none",
  },
  dialogPostItem: {
    padding: "6px 12px",
    cursor: "pointer",
    borderRadius: 4,
    fontSize: "0.9375rem",
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.text.normal,
    transition: "background 0.1s",
    "&:hover": {
      background: theme.palette.grey[100],
    },
  },
  dialogPostItemDisabled: {
    opacity: 0.4,
    cursor: "default",
    "&:hover": {
      background: "none",
    },
  },
  dialogPostItemCheck: {
    color: theme.palette.grey[400],
    marginRight: theme.spacing.unit,
    fontSize: "0.8125rem",
  },
  noResults: {
    padding: "12px",
    color: theme.palette.grey[500],
    fontSize: "0.875rem",
  },
}));

const SwapIcon = ({ classes }: { classes: ClassesType<typeof styles> }) => (
  <svg className={classes.swapIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 7.5L8 7.5M21 7.5L16.6667 3M21 7.5L16.6667 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 16.5L17 16.5M4 16.5L8.33333 21M4 16.5L8.33333 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DragDots = ({ classes }: { classes: ClassesType<typeof styles> }) => (
  <div className={classes.dragDots}>
    <span />
    <span />
    <span />
    <span />
    <span />
  </div>
);

function computePlacement(anchorEl: HTMLElement): PopperPlacementType {
  const rect = anchorEl.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  // If the anchor is in the lower 40% of the viewport, show above
  if (rect.bottom > viewportHeight * 0.6) {
    return "top-start";
  }
  return "bottom-start";
}

function handleDocumentMouseDown(
  event: MouseEvent,
  searchRef: React.RefObject<HTMLDivElement | null>,
  anchorEl: HTMLElement | null,
  closeSearch: () => void
) {
  const target = event.target as Node;
  // Don't close if clicking inside the search dialog or on the anchor (swap button)
  if (searchRef.current?.contains(target)) return;
  if (anchorEl?.contains(target)) return;
  closeSearch();
}

function handleDocumentKeyDown(event: KeyboardEvent, closeSearch: () => void) {
  if (event.key === "Escape") {
    closeSearch();
  }
}

function SortablePostRow({
  post,
  index,
  showSwapButtons,
  isSwapActive,
  activeDragId,
  onSwapClick,
  classes,
}: {
  post: PostItem;
  index: number;
  showSwapButtons: boolean;
  isSwapActive: boolean;
  activeDragId: string | null;
  onSwapClick: (index: number, anchorEl: HTMLElement) => void;
  classes: ClassesType<typeof styles>;
}) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: post._id });

  const setSortableAndCardRef = useCallback((node: HTMLDivElement | null) => {
    setNodeRef(node);
    cardRef.current = node;
  }, [setNodeRef]);

  const handleContentClick = useCallback(() => {
    if (!showSwapButtons || !cardRef.current) return;
    onSwapClick(index, cardRef.current);
  }, [showSwapButtons, onSwapClick, index]);

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
        ref={setSortableAndCardRef}
        style={cardStyle}
        className={classes.postItem}
      >
        <div
          className={classNames(classes.dragHandle, { [classes.dragHandleActive]: isDragging })}
          {...attributes}
          {...listeners}
        >
          <DragDots classes={classes} />
        </div>
        <div className={classes.postContent} onClick={handleContentClick}>
          <span className={classes.postTitle}>
            {post.title}
          </span>
          <div className={classes.postMeta}>
            {post.baseScore} · {moment(new Date(post.postedAt)).fromNow()}
          </div>
        </div>
        {showSwapButtons && (
          <button
            className={classNames(classes.swapButton, { [classes.swapButtonActive]: isSwapActive })}
            onClick={(e) => onSwapClick(index, e.currentTarget)}
            type="button"
          >
            <SwapIcon classes={classes} />
          </button>
        )}
      </div>
    </div>
  );
}

export const TopPostsManager = ({ userId, pinnedPostIds: initialPinnedPostIds }: { userId: string; pinnedPostIds?: string[] | null }) => {
  const classes = useStyles(styles);
  const [orderedPostIds, setOrderedPostIds] = useState<string[] | null>(initialPinnedPostIds ?? null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [swapSlotIndex, setSwapSlotIndex] = useState<number | null>(null);
  const [swapAnchorEl, setSwapAnchorEl] = useState<HTMLElement | null>(null);
  const [swapPlacement, setSwapPlacement] = useState<PopperPlacementType>("bottom-start");
  const [swapDialogWidth, setSwapDialogWidth] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const mouse = useSensor(MouseSensor, { activationConstraint: { distance: 5 } });
  const pointer = useSensor(PointerSensor, { activationConstraint: { distance: 5 } });
  const keyboard = useSensor(KeyboardSensor);
  const sensors = useSensors(mouse, pointer, keyboard);

  const [updatePinnedPosts] = useMutation(UpdatePinnedPostIdsMutation);

  const { data, loading } = useQuery(UserTopPostsQuery, {
    variables: { 
      selector: userId ? { 
        userPosts: { userId, sortedBy: "top" }
      } : undefined,
      limit: 50,
    },
    skip: !userId,
    fetchPolicy: "network-only",
  });

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

  const persistPinnedPosts = useCallback(async (newIds: string[] | null) => {
    try {
      await updatePinnedPosts({
        variables: {
          selector: { _id: userId },
          data: { pinnedPostIds: newIds },
        },
        refetchQueries: ['ProfileUserQuery'],
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to save pinned posts:', e);
    }
  }, [userId, updatePinnedPosts]);

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
        const newOrder = arrayMove(currentIds, oldIndex, newIndex);
        setOrderedPostIds(newOrder);
        persistPinnedPosts(newOrder);
      }
    }
  }, [orderedPostIds, postIds, persistPinnedPosts]);

  const handleDragCancel = useCallback(() => {
    setActiveDragId(null);
  }, []);

  const handleRestoreDefaults = useCallback(() => {
    setOrderedPostIds(null);
    persistPinnedPosts(null);
  }, [persistPinnedPosts]);

  const handleSwapClick = useCallback((index: number, anchorEl: HTMLElement) => {
    setSwapSlotIndex(prevIndex => {
      if (prevIndex === index) {
        setSwapAnchorEl(null);
        return null;
      }
      // anchorEl may be the card itself (content click) or the swap button;
      // walk up to the postItem card if needed by checking for the postItem class
      const cardEl = anchorEl.classList.contains(classes.postItem)
        ? anchorEl
        : (anchorEl.parentElement as HTMLElement | null) ?? anchorEl;
      setSwapAnchorEl(cardEl);
      setSwapPlacement(computePlacement(cardEl));
      setSwapDialogWidth(cardEl.offsetWidth);
      return index;
    });
    setSearch("");
  }, [classes.postItem]);

  const handleCloseSearch = useCallback(() => {
    setSwapSlotIndex(null);
    setSwapAnchorEl(null);
    setSearch("");
  }, []);

  const handleSwapSelect = useCallback((postId: string) => {
    if (swapSlotIndex === null) return;
    if (postIds.includes(postId)) return;
    const currentIds = orderedPostIds ?? postIds;
    const newIds = [...currentIds];
    newIds[swapSlotIndex] = postId;
    setOrderedPostIds(newIds);
    persistPinnedPosts(newIds);
    setSwapSlotIndex(null);
    setSwapAnchorEl(null);
    setSearch("");
  }, [swapSlotIndex, orderedPostIds, postIds, persistPinnedPosts]);

  const filteredPosts = useMemo(() => {
    if (!search.trim()) return allPosts;
    const term = search.toLowerCase();
    return allPosts.filter(p => p.title.toLowerCase().includes(term));
  }, [allPosts, search]);

  useEffect(() => {
    if (swapSlotIndex === null) return;
    const onMouseDown = (e: MouseEvent) => handleDocumentMouseDown(e, searchRef, swapAnchorEl, handleCloseSearch);
    const onKeyDown = (e: KeyboardEvent) => handleDocumentKeyDown(e, handleCloseSearch);
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [swapSlotIndex, swapAnchorEl, handleCloseSearch]);

  // Focus the search input after the popper has positioned, using
  // preventScroll to avoid the browser jumping the page.
  useEffect(() => {
    if (swapSlotIndex === null) return;
    const frameId = requestAnimationFrame(() => {
      searchInputRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frameId);
  }, [swapSlotIndex]);

  // Don't show if loading or user has fewer than 4 posts
  if (loading || postCount < 4) {
    return null;
  }

  return (
    <div className={classes.root}>
      <PopperCard
        open={swapSlotIndex !== null}
        anchorEl={swapAnchorEl}
        placement={swapPlacement}
        className={classes.searchDialog}
        style={swapDialogWidth ? { width: swapDialogWidth } : undefined}
      >
        <div ref={searchRef}>
          <input
            ref={searchInputRef}
            className={classes.searchInput}
            placeholder="Search your posts"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ul className={classes.dialogPostList}>
            {filteredPosts.length === 0 && (
              <li className={classes.noResults}>No posts found</li>
            )}
            {filteredPosts.map((post) => {
              const isAlreadySelected = postIds.includes(post._id);
              return (
                <li
                  key={post._id}
                  className={classNames(classes.dialogPostItem, {
                    [classes.dialogPostItemDisabled]: isAlreadySelected,
                  })}
                  onClick={() => handleSwapSelect(post._id)}
                >
                  {isAlreadySelected && <span className={classes.dialogPostItemCheck}>&#10003;</span>}
                  {post.title}
                </li>
              );
            })}
          </ul>
        </div>
      </PopperCard>
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
                isSwapActive={swapSlotIndex === index}
                activeDragId={activeDragId}
                onSwapClick={handleSwapClick}
                classes={classes}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
