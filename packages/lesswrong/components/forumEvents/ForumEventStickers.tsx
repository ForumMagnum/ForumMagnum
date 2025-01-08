import { useMulti } from "@/lib/crud/withMulti";
import { gql, useMutation } from "@apollo/client";
import React, { FC, useCallback, useMemo, useRef, useState } from "react";
import { useLoginPopoverContext } from "../hooks/useLoginPopoverContext";
import { useCurrentUser } from "../common/withUser";
import { Components, registerComponent } from "@/lib/vulcan-lib";
import { useCurrentForumEvent } from "../hooks/useCurrentForumEvent";
import { commentGetPageUrlFromIds } from "@/lib/collections/comments/helpers";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { Link } from "@/lib/reactRouterWrapper";
import { InteractionWrapper } from "../common/useClickableCell";
import { useIsAboveBreakpoint } from "../hooks/useScreenWidth";
import { AnalyticsContext } from "@/lib/analyticsEvents";

const styles = (theme: ThemeType) => ({
  stickersContainer: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0
  },
  placeHeartButton: {
    position: "absolute",
    cursor: "pointer",
    fontWeight: 600,
    bottom: 12,
    left: 24,
    "&:hover": {
      opacity: 0.8,
    },
  }
});

const upsertForumEventStickerQuery = gql`
  mutation UpsertForumEventSticker($forumEventId: String!, $x: Float!, $y: Float!, $theta: Float!, $emoji: String) {
    UpsertForumEventSticker(forumEventId: $forumEventId, x: $x, y: $y, theta: $theta, emoji: $emoji)
  }
`;
const removeForumEventStickerQuery = gql`
  mutation RemoveForumEventSticker($forumEventId: String!) {
    RemoveForumEventSticker(forumEventId: $forumEventId)
  }
`;

type ForumEventStickerData = Record<
  string,
  {
    x: number;
    y: number;
    theta: number;
    emoji?: string;
  }
>;

type ForumEventStickerDisplay = {
  x: number;
  y: number;
  theta: number;
  emoji: string;
  user: UsersMinimumInfo;
  comment: ShortformComments | null;
};

function stickerDataToArray({
  data,
  users,
  comments,
  currentUser
}: {
  data: ForumEventStickerData | null;
  users: UsersMinimumInfo[] | undefined;
  comments: ShortformComments[] | undefined;
  currentUser: UsersCurrent | null;
}): { currentUserSticker: ForumEventStickerDisplay | null, otherStickers: ForumEventStickerDisplay[] } {
  if (!users || !data) {
    return { currentUserSticker: null, otherStickers: [] };
  }

  const allStickers = users
    .map((user) => {
      const sticker = data[user._id];
      if (!sticker) return undefined;

      const comment = comments?.find(comment => comment.userId === user._id) || null;
      return {
        x: sticker.x,
        y: sticker.y,
        theta: sticker.theta,
        emoji: sticker.emoji,
        user,
        comment,
      };
    })
    .filter((sticker) => !!sticker) as ForumEventStickerDisplay[];

  const currentUserSticker = allStickers.find(heart => currentUser && heart.user._id === currentUser._id) || null;
  const otherStickers = allStickers.filter(heart => !currentUser || heart.user._id !== currentUser._id);

  return { currentUserSticker, otherStickers };
}

const ForumEventStickers: FC<{
  classes: ClassesType<typeof styles>;
}> = ({ classes }) => {
  const { ForumEventCommentForm, ForumEventSticker } = Components;

  const { currentForumEvent, refetch } = useCurrentForumEvent();
  const { onSignup } = useLoginPopoverContext();
  const currentUser = useCurrentUser();

  const isDesktop = useIsAboveBreakpoint("sm");
  const [mobilePlacingSticker, setMobilePlacingSticker] = useState(false)

  const stickerData: ForumEventStickerData | null = currentForumEvent?.publicData || null;

  const { results: users } = useMulti({
    terms: {
      view: 'usersByUserIds',
      userIds: stickerData
        ? Object.keys(stickerData)
        : [],
      limit: 1000,
    },
    collectionName: "Users",
    fragmentName: 'UsersMinimumInfo',
    enableTotal: false,
    skip: !stickerData,
  });
  const { results: comments, refetch: refetchComments } = useMulti({
    terms: {
      view: 'forumEventComments',
      forumEventId: currentForumEvent?._id,
      limit: 1000,
    },
    collectionName: "Comments",
    fragmentName: 'ShortformComments',
    enableTotal: false,
    // Don't run on the first pass, to speed up SSR
    skip: !currentForumEvent?._id || !users,
  });

  // Maintain a ref that keeps the previous value of `users` when it is currently undefined, to avoid the stickers flickering
  const displayUsersRef = useRef<UsersMinimumInfo[] | undefined>(users);

  if (users && displayUsersRef.current !== users) {
    displayUsersRef.current = users;
  }

  const { currentUserSticker, otherStickers } = useMemo(
    () => stickerDataToArray({ data: stickerData, users: displayUsersRef.current, comments, currentUser }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [comments, currentUser, stickerData, displayUsersRef.current]
  );

  const [draftSticker, setDraftSticker] = useState<ForumEventStickerData[keyof ForumEventStickerData] | null>(null);

  // Note: For some reason typescript can't figure this type out on its own
  const displaySticker = (draftSticker ?? currentUserSticker) as (typeof draftSticker | typeof currentUserSticker);

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

  const [upsertSticker] = useMutation(upsertForumEventStickerQuery);
  const [removeSticker] = useMutation(removeForumEventStickerQuery);

  const allowPlacingSticker = !currentUserSticker && (isDesktop || mobilePlacingSticker);

  const refetchAll = useCallback(async () => {
    void refetch?.();
    void refetchComments?.();
  }, [refetch, refetchComments]);

  const saveDraftSticker = useCallback(
    async (event: React.MouseEvent) => {
      if (!currentForumEvent || !allowPlacingSticker) return;

      if (!currentUser) {
        onSignup();
        return;
      }

      const coords = normalizeCoords(event.clientX, event.clientY);

      if (!coords || currentUserSticker) return;

      if (currentForumEvent.post) {
        setCommentFormOpen(true);
      }

      setDraftSticker({
        ...coords,
        theta: hoverTheta,
      });

      setMobilePlacingSticker(false);
    },
    [currentForumEvent, allowPlacingSticker, currentUser, normalizeCoords, currentUserSticker, hoverTheta, onSignup]
  );

  const commitDraftSticker = useCallback(async () => {
    if (!currentForumEvent || !draftSticker?.emoji) return;

    await upsertSticker({
      variables: {
        ...draftSticker,
        forumEventId: currentForumEvent._id,
      },
    });
    void refetchAll();
    setDraftSticker(null);
    setCommentFormOpen(false);
  }, [currentForumEvent, draftSticker, upsertSticker, refetchAll]);

  const clearSticker = useCallback(async () => {
    if (!currentForumEvent) return;

    if (draftSticker) {
      setDraftSticker(null);
    } else {
      await removeSticker({ variables: { forumEventId: currentForumEvent!._id } });
      void refetch?.();
    }

  }, [currentForumEvent, draftSticker, refetch, removeSticker])

  const onCloseCommentForm = useCallback(async () => {
    setCommentFormOpen(false);
    setDraftSticker(null);
  }, [])

  const setEmoji = useCallback((emoji: string) => {
    setDraftSticker((prev) => prev ? { ...prev, emoji } : null);
  }, [])

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!allowPlacingSticker) return;

      const coords = normalizeCoords(event.clientX, event.clientY);
      if (coords) {
        setHoverPos(coords);
      } else {
        setHoverPos(null);
      }
    },
    [normalizeCoords, allowPlacingSticker]
  );

  const handleMouseLeave = useCallback(() => {
    if (!allowPlacingSticker) return;

    setHoverPos(null);
  }, [allowPlacingSticker]);

  if (!currentForumEvent) return null;

  return (
    <AnalyticsContext pageElementContext="forumEventStickers">
      <div
        className={classes.stickersContainer}
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        // TODO I believe this is only required for mobile, check
        onClick={async (event) => {
          console.log("Calling saveStickerPos from stickersContainer")
          return saveDraftSticker(event)
        }}
      >
        {allowPlacingSticker && hoverPos && (
          // TODO work out why this is still showing behind other stickers
          <ForumEventSticker
            x={hoverPos.x}
            y={hoverPos.y}
            theta={hoverTheta}
            saveDraftSticker={saveDraftSticker}
          />
        )}
        {displaySticker && (
          <ForumEventSticker
            {...displaySticker}
            tooltipDisabled={commentFormOpen}
            ref={setUserVoteRef}
            onClear={clearSticker}
          />
        )}
        {otherStickers.map((heart, index) => (
          <ForumEventSticker key={index} {...heart} />
        ))}
        {!isDesktop && !currentUserSticker && (
          <InteractionWrapper>
            <div className={classes.placeHeartButton} onClick={() => setMobilePlacingSticker(!mobilePlacingSticker)}>
              {(mobilePlacingSticker ? "Tap the banner to add a heart, or tap here to cancel" : "+ Add heart")}
            </div>
          </InteractionWrapper>
        )}
      </div>
      {currentForumEvent.post && (
        <ForumEventCommentForm
          open={commentFormOpen}
          comment={(displaySticker && "comment" in displaySticker) ? (displaySticker.comment || null) : null}
          forumEventId={currentForumEvent._id}
          cancelCallback={onCloseCommentForm}
          successCallback={commitDraftSticker}
          setEmoji={setEmoji}
          anchorEl={userVoteRef}
          post={currentForumEvent.post}
          // TODO update, allow editable field
          title="Where did you donate this year?"
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
    </AnalyticsContext>
  );
};

const ForumEventStickersComponent = registerComponent( 'ForumEventStickers', ForumEventStickers, {styles});

declare global {
  interface ComponentTypes {
    ForumEventStickers: typeof ForumEventStickersComponent;
  }
}
