import { useMulti } from "@/lib/crud/withMulti";
import { gql, useMutation } from "@apollo/client";
import React, { FC, useCallback, useMemo, useRef, useState } from "react";
import { useLoginPopoverContext } from "../hooks/useLoginPopoverContext";
import { useCurrentUser } from "../common/withUser";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { useCurrentAndRecentForumEvents } from "../hooks/useCurrentForumEvent";
import { commentGetPageUrlFromIds } from "@/lib/collections/comments/helpers";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { Link } from "@/lib/reactRouterWrapper";
import { InteractionWrapper } from "../common/useClickableCell";
import { useIsAboveBreakpoint } from "../hooks/useScreenWidth";
import { AnalyticsContext } from "@/lib/analyticsEvents";
import type { ForumEventStickerInput, ForumEventStickerData } from "@/lib/collections/forumEvents/types";
import { randomId } from "@/lib/random";
import keyBy from "lodash/keyBy";
import { useModerateComment } from "../dropdowns/comments/withModerateComment";
import { useMessages } from "../common/withMessages";
import ForumEventCommentForm from "./ForumEventCommentForm";
import ForumEventSticker from "./ForumEventSticker";

const styles = (theme: ThemeType) => ({
  stickersContainer: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0
  },
  mobileOverlay: {
    pointerEvents: "none",
    position: "absolute",
    width: "100%",
    height: "100%",
    // Translucent gradient so the text is readable over the stickers on mobile
    background: theme.palette.forumEvent.stickerMobileOverlay,
    [theme.breakpoints.up("sm")]: {
      display: "none"
    },
  },
  hoverContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  placeStickerButton: {
    position: "absolute",
    cursor: "pointer",
    fontWeight: 500,
    fontSize: 14,
    bottom: 12,
    left: 20,
    "&:hover": {
      opacity: 0.8,
    },
  }
});

const ForumEventStickers: FC<{
  classes: ClassesType<typeof styles>;
}> = ({ classes }) => {
  const { currentForumEvent, refetch } = useCurrentAndRecentForumEvents();
  const { onSignup } = useLoginPopoverContext();
  const currentUser = useCurrentUser();
  const { flash } = useMessages();

  const isDesktop = useIsAboveBreakpoint("sm");
  const [mobilePlacingSticker, setMobilePlacingSticker] = useState(false)

  const stickerData = (currentForumEvent?.publicData as ForumEventStickerData | undefined)?.data;
  const stickers = Array.isArray(stickerData) ? stickerData : [];

  const uniqueUserIds = Array.from(new Set(stickers.map(sticker => sticker.userId).filter(id => id)));
  const uniqueCommentIds = Array.from(new Set(stickers.map(sticker => sticker.commentId).filter(id => id)));

  const { results: users } = useMulti({
    terms: {
      view: 'usersByUserIds',
      userIds: uniqueUserIds,
      limit: 1000,
    },
    collectionName: "Users",
    fragmentName: 'UsersMinimumInfo',
    enableTotal: false,
    skip: !stickers,
  });
  const { results: comments, refetch: refetchComments } = useMulti({
    terms: {
      commentIds: uniqueCommentIds,
      limit: 1000,
    },
    collectionName: "Comments",
    fragmentName: 'ShortformComments',
    enableTotal: false,
    // Don't run on the first pass, to speed up SSR
    skip: !uniqueCommentIds || !uniqueCommentIds.length || !users,
  });

  const usersById = keyBy(users, "_id")
  const commentsById = keyBy(comments, "_id")

  const [draftSticker, setDraftSticker] = useState<{_id: string, x: number, y: number, theta: number, emoji?: string} | null>(null);

  const [commentFormOpen, setCommentFormOpen] = useState(false);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(
    null
  );
  // Random rotation between -25 and 25 degrees
  const hoverTheta = useMemo(() => (Math.random() * 50) - 25, []);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [userVoteRef, setUserVoteRef] = useState<HTMLDivElement | null>(null);

  const normalizeCoords = useCallback(
    (clientX: number, clientY: number) => {
      if (containerRef.current) {
        const bounds = containerRef.current.getBoundingClientRect();
        if (
          clientX > bounds.left &&
          clientX < bounds.right &&
          clientY > bounds.top &&
          clientY < bounds.bottom
        ) {
          return {
            x: (clientX - bounds.left) / bounds.width,
            y: (clientY - bounds.top) / bounds.height,
          };
        }
      }
      return null;
    },
    [containerRef]
  );

  const [removeSticker] = useMutation(gql`
    mutation RemoveForumEventSticker($forumEventId: String!, $stickerId: String!) {
      RemoveForumEventSticker(forumEventId: $forumEventId, stickerId: $stickerId)
    }
  `);
  const {moderateCommentMutation} = useModerateComment({fragmentName: "CommentsList"});

  const currentUserStickerCount = stickers.filter(s => s.userId === currentUser?._id).length
  const allowAddingSticker = currentUserStickerCount < (currentForumEvent?.maxStickersPerUser ?? 0)
  const isPlacingSticker = allowAddingSticker && !draftSticker && (isDesktop || mobilePlacingSticker);

  const refetchAll = useCallback(async () => {
    void refetch?.();
    void refetchComments?.();
  }, [refetch, refetchComments]);

  const saveDraftSticker = useCallback(
    async (event: React.MouseEvent) => {
      if (!currentForumEvent || !isPlacingSticker) return;

      if (!currentUser) {
        onSignup();
        return;
      }

      const coords = normalizeCoords(event.clientX, event.clientY);

      if (!coords) return;

      if (currentForumEvent.post) {
        setCommentFormOpen(true);
      }

      setDraftSticker({
        _id: randomId(),
        ...coords,
        theta: hoverTheta,
      });

      setMobilePlacingSticker(false);
    },
    [currentForumEvent, isPlacingSticker, currentUser, normalizeCoords, hoverTheta, onSignup]
  );

  const onSuccess = useCallback(async () => {
    if (!currentForumEvent || !draftSticker?.emoji) return;

    void refetchAll();
    setDraftSticker(null);
    setCommentFormOpen(false);
  }, [currentForumEvent, draftSticker, refetchAll]);

  const clearSticker = useCallback(async (sticker: typeof stickers[number] | null) => {
    if (!currentForumEvent) return;

    if (!sticker) {
      setDraftSticker(null);
    } else {
      await removeSticker({ variables: { forumEventId: currentForumEvent!._id, stickerId: sticker._id } });
      await moderateCommentMutation({
        commentId: sticker.commentId,
        deleted: true,
        deletedPublic: true,
        deletedReason: "",
      });
      await navigator.clipboard.writeText(commentGetPageUrlFromIds({ postId: currentForumEvent.postId, commentId: sticker.commentId, isAbsolute: true }));
      flash("Sticker and comment deleted. The comment link has been copied to your clipboard in case you want to un–delete it.");

      await refetch?.();
    }

  }, [currentForumEvent, flash, moderateCommentMutation, refetch, removeSticker])

  const onCloseCommentForm = useCallback(async () => {
    setCommentFormOpen(false);
    setDraftSticker(null);
  }, [])

  const setEmoji = useCallback((emoji: string) => {
    setDraftSticker((prev) => prev ? { ...prev, emoji } : null);
  }, [])

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!isPlacingSticker) return;

      const coords = normalizeCoords(event.clientX, event.clientY);
      if (coords) {
        setHoverPos(coords);
      } else {
        setHoverPos(null);
      }
    },
    [isPlacingSticker, normalizeCoords]
  );

  const handleMouseLeave = useCallback(() => {
    if (!isPlacingSticker) return;

    setHoverPos(null);
  }, [isPlacingSticker]);

  const prefilledProps: Partial<DbComment> = {
    forumEventMetadata: {
      eventFormat: "STICKERS",
      sticker: draftSticker as ForumEventStickerInput, // Validated on the server
      poll: null
    },
  };

  if (!currentForumEvent) return null;

  return (
    <AnalyticsContext pageElementContext="forumEventStickers">
      <div className={classes.stickersContainer}>
        <div
          className={classes.hoverContainer}
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={saveDraftSticker} // Required for mobile, where the hover icon doesn't show
        >
          {isPlacingSticker && hoverPos && (
            <ForumEventSticker x={hoverPos.x} y={hoverPos.y} theta={hoverTheta} saveDraftSticker={saveDraftSticker} />
          )}
        </div>
        {draftSticker && (
          <ForumEventSticker
            {...draftSticker}
            tooltipDisabled={commentFormOpen}
            setUserVoteRef={setUserVoteRef}
            onClear={() => clearSticker(null)}
          />
        )}
        {stickers.map((sticker, index) => (
          <ForumEventSticker
            key={index}
            {...sticker}
            onClear={sticker.userId === currentUser?._id ? () => clearSticker(sticker) : undefined}
            user={usersById[sticker.userId]}
            comment={(sticker.commentId && commentsById[sticker.commentId]) || undefined}
          />
        ))}
      </div>
      {currentForumEvent.post && (
        <ForumEventCommentForm
          open={commentFormOpen}
          comment={null}
          forumEvent={currentForumEvent}
          cancelCallback={onCloseCommentForm}
          successCallback={onSuccess}
          setEmoji={setEmoji}
          anchorEl={userVoteRef}
          post={currentForumEvent.post}
          prefilledProps={prefilledProps}
          title={currentForumEvent.commentPrompt ?? "Add your comment"}
          subtitle={(post, comment) => (
            <>
              <div>
                Your response will appear as a comment on{" "}
                <Link
                  to={
                    comment
                      ? commentGetPageUrlFromIds({ postId: comment.postId, commentId: comment._id })
                      : postGetPageUrl(post)
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  this post
                </Link>
                , and show on hover on this banner.
              </div>
            </>
          )}
        />
      )}
      <div className={classes.mobileOverlay} />
      {!isDesktop && allowAddingSticker && (
        <InteractionWrapper>
          <div className={classes.placeStickerButton} onClick={() => setMobilePlacingSticker(!mobilePlacingSticker)}>
            {mobilePlacingSticker ? "Place your sticker, or tap here to cancel" : "+ Add sticker"}
          </div>
        </InteractionWrapper>
      )}
    </AnalyticsContext>
  );
};

export default registerComponent( 'ForumEventStickers', ForumEventStickers, {styles});


