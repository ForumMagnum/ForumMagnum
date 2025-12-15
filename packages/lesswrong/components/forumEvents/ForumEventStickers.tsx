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
import ForumEventCommentForm from "./ForumEventCommentForm";
import ForumEventSticker from "./ForumEventSticker";
import type { ForumIconName } from "../common/ForumIcon";
import DeferRender from "../common/DeferRender";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0
  },
  isPlacing: {
    // Hide the cursor over the entire container when placing - this prevents
    // the mouse from "escaping" the draft emoji when moving fast
    cursor: "none",
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
  icon?: ForumIconName,
  iconClassName?: string,
  noMobileOverlay?: boolean,
  className?: string,
  classes: ClassesType<typeof styles>;
}> = ({ icon, iconClassName, noMobileOverlay, className, classes }) => {
  const { currentForumEvent, refetch } = useCurrentAndRecentForumEvents();
  const { onSignup } = useLoginPopoverContext();
  const currentUser = useCurrentUser();

  const isDesktop = useIsAboveBreakpoint("sm");
  const [mobilePlacingSticker, setMobilePlacingSticker] = useState(false)

  const stickerData = (currentForumEvent?.publicData as ForumEventStickerData | undefined)?.data;
  const stickers = Array.isArray(stickerData) ? stickerData : [];

  const uniqueUserIds = Array.from(new Set(stickers.map(sticker => sticker.userId).filter(id => id)));
  const uniqueCommentIds = Array.from(new Set(stickers.map(sticker => sticker.commentId).filter((id): id is string => !!id)));

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

  const [draftSticker, setDraftSticker] = useState<ForumEventStickerInput | null>(null);

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
  const [addSticker] = useMutation(gql`
    mutation AddForumEventSticker($forumEventId: String!, $stickerId: String!, $x: Float!, $y: Float!, $theta: Float!, $emoji: String) {
      AddForumEventSticker(forumEventId: $forumEventId, stickerId: $stickerId, x: $x, y: $y, theta: $theta, emoji: $emoji)
    }
  `);
  const {moderateCommentMutation} = useModerateComment({fragmentName: "CommentsList"});
  
  // Track the sticker ID when we save it before showing the comment form
  const [savedStickerId, setSavedStickerId] = useState<string | null>(null);

  const currentUserStickerCount = stickers.filter(s => s.userId === currentUser?._id).length
  const allowAddingSticker = currentUserStickerCount < (currentForumEvent?.maxStickersPerUser ?? 0)
  const isPlacingSticker = allowAddingSticker && !draftSticker && (isDesktop || mobilePlacingSticker);

  const refetchAll = useCallback(async () => {
    void refetch?.();
    void refetchComments?.();
  }, [refetch, refetchComments]);

  const stickerRequiresComment = currentForumEvent?.stickerRequiresComment ?? true;

  const saveDraftSticker = useCallback(
    async (event: React.MouseEvent) => {
      if (!currentForumEvent || !isPlacingSticker) return;

      if (!currentUser) {
        onSignup();
        return;
      }

      const coords = normalizeCoords(event.clientX, event.clientY);

      if (!coords) return;

      const stickerId = randomId();

      // If comment is not required, save sticker immediately then optionally show comment form
      if (!stickerRequiresComment) {
        // Set draft sticker for the anchor element, then save in background
        setDraftSticker({
          _id: stickerId,
          ...coords,
          theta: hoverTheta,
          emoji: null,
        });
        setSavedStickerId(stickerId);
        
        // Save sticker (don't await - let it happen in background)
        void addSticker({
          variables: {
            forumEventId: currentForumEvent._id,
            stickerId,
            x: coords.x,
            y: coords.y,
            theta: hoverTheta,
            emoji: null,
          },
        }).then(() => refetch?.());
        
        // Show comment form if there's a post
        if (currentForumEvent.post) {
          setCommentFormOpen(true);
        }
        setMobilePlacingSticker(false);
        return;
      }

      // Otherwise, show draft sticker and open comment form (original behavior)
      if (currentForumEvent.post) {
        setCommentFormOpen(true);
      }

      setDraftSticker({
        _id: stickerId,
        ...coords,
        theta: hoverTheta,
        emoji: null,
      });

      setMobilePlacingSticker(false);
    },
    [currentForumEvent, isPlacingSticker, currentUser, normalizeCoords, hoverTheta, onSignup, stickerRequiresComment, addSticker, refetch]
  );

  const onSuccess = useCallback(async () => {
    if (!currentForumEvent) {
      return;
    }

    void refetchAll();
    setDraftSticker(null);
    setCommentFormOpen(false);
    setSavedStickerId(null);
  }, [currentForumEvent, refetchAll]);

  const clearSticker = useCallback(async (sticker: typeof stickers[number] | null) => {
    if (!currentForumEvent) return;

    if (!sticker) {
      setDraftSticker(null);
      setSavedStickerId(null);
    } else {
      await removeSticker({
        variables: {
          forumEventId: currentForumEvent!._id,
          stickerId: sticker._id,
        },
      });

      // If there's an associated comment, delete it too
      if (sticker.commentId) {
        await moderateCommentMutation({
          commentId: sticker.commentId,
          deleted: true,
          deletedPublic: true,
          deletedReason: "",
        });
      }

      await refetch?.();
    }

  }, [currentForumEvent, moderateCommentMutation, refetch, removeSticker])

  const onCloseCommentForm = useCallback(async () => {
    setCommentFormOpen(false);
    setDraftSticker(null);
    setSavedStickerId(null);
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

  // When savedStickerId is set, the sticker was already saved directly,
  // so only include the _id (backend will link instead of create)
  const prefilledProps: Partial<DbComment> = {
    forumEventMetadata: {
      eventFormat: "STICKERS",
      sticker: savedStickerId ? { _id: savedStickerId } : draftSticker,
      poll: null
    },
  };

  if (!currentForumEvent) return null;

  return (
    <AnalyticsContext pageElementContext="forumEventStickers">
      <div className={classNames(
        classes.root,
        isPlacingSticker && hoverPos && classes.isPlacing,
        className,
      )}>
        <div
          className={classes.hoverContainer}
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={saveDraftSticker} // Required for mobile, where the hover icon doesn't show
        >
          {isPlacingSticker && hoverPos && (
            <ForumEventSticker
              x={hoverPos.x}
              y={hoverPos.y}
              theta={hoverTheta}
              saveDraftSticker={saveDraftSticker}
              icon={icon}
              iconClassName={iconClassName}
            />
          )}
        </div>
        {draftSticker && (
          <ForumEventSticker
            {...draftSticker}
            icon={icon}
            iconClassName={iconClassName}
            tooltipDisabled={commentFormOpen}
            setUserVoteRef={setUserVoteRef}
            onClear={() => clearSticker(null)}
          />
        )}
        {stickers.map((sticker, index) => (
          <ForumEventSticker
            key={index}
            {...sticker}
            icon={icon}
            iconClassName={iconClassName}
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
          setEmoji={icon ? undefined : setEmoji}
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
      {!noMobileOverlay && <div className={classes.mobileOverlay} />}
      {!isDesktop && allowAddingSticker && (
        <DeferRender ssr={false}>
          <InteractionWrapper>
            <div
              className={classes.placeStickerButton}
              onClick={() => setMobilePlacingSticker(!mobilePlacingSticker)}
            >
              {mobilePlacingSticker
                ? "Place your sticker, or tap here to cancel"
                : "+ Add sticker"
              }
            </div>
          </InteractionWrapper>
        </DeferRender>
      )}
    </AnalyticsContext>
  );
};

export default registerComponent('ForumEventStickers', ForumEventStickers, {styles});
