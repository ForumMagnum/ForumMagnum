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

const addForumEventStickerQuery = gql`
  mutation AddForumEventSticker($forumEventId: String!, $x: Float!, $y: Float!, $theta: Float!) {
    AddForumEventSticker(forumEventId: $forumEventId, x: $x, y: $y, theta: $theta)
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
  }
>;

type ForumEventStickerDisplay = {
  x: number;
  y: number;
  theta: number;
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
  interactive: boolean;
  classes: ClassesType<typeof styles>;
}> = ({ interactive, classes }) => {
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

  const [addSticker] = useMutation(addForumEventStickerQuery);
  const [removeSticker] = useMutation(removeForumEventStickerQuery);

  const allowPlacingSticker = !currentUserSticker && (isDesktop || mobilePlacingSticker);

  const saveStickerPos = useCallback(
    async (event: React.MouseEvent) => {
      if (!currentForumEvent || !allowPlacingSticker) return;

      if (currentUser) {
        const coords = normalizeCoords(event.clientX, event.clientY);

        if (!coords || currentUserSticker) return;

        if (currentForumEvent.post) {
          setCommentFormOpen(true);
        }

        await addSticker({
          variables: {
            ...coords,
            theta: hoverTheta,
            forumEventId: currentForumEvent._id,
          },
        });
        setMobilePlacingSticker(false);
        refetch?.();
      } else {
        onSignup();
      }
    },
    [currentForumEvent, allowPlacingSticker, currentUser, normalizeCoords, currentUserSticker, addSticker, hoverTheta, refetch, onSignup]
  );

  const clearSticker = useCallback(async () => {
    if (!currentForumEvent) return;

    await removeSticker({ variables: { forumEventId: currentForumEvent!._id } });
    refetch?.();
  }, [currentForumEvent, refetch, removeSticker])

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
        {...(interactive && {
          onMouseMove: handleMouseMove,
          onMouseLeave: handleMouseLeave,
          onClick: saveStickerPos,
        })}
      >
        {allowPlacingSticker && hoverPos && (
          <ForumEventSticker
            x={hoverPos.x}
            y={hoverPos.y}
            theta={hoverTheta}
            icon="Heart"
            saveStickerPos={saveStickerPos}
          />
        )}
        {currentUserSticker && (
          <ForumEventSticker
            {...currentUserSticker}
            tooltipDisabled={commentFormOpen}
            icon="Heart"
            ref={setUserVoteRef}
            onClear={clearSticker}
          />
        )}
        {otherStickers.map((heart, index) => (
          <ForumEventSticker key={index} {...heart} icon="Heart" />
        ))}
        {!isDesktop && !currentUserSticker && (
          <InteractionWrapper>
            <div className={classes.placeHeartButton} onClick={() => setMobilePlacingSticker(!mobilePlacingSticker)}>
              {!!interactive && (mobilePlacingSticker ? "Tap the banner to add a heart, or tap here to cancel" : "+ Add heart")}
            </div>
          </InteractionWrapper>
        )}
      </div>
      {currentForumEvent.post && (
        <ForumEventCommentForm
          open={commentFormOpen}
          comment={currentUserSticker?.comment || null}
          forumEventId={currentForumEvent._id}
          onClose={() => setCommentFormOpen(false)}
          refetch={refetchComments}
          anchorEl={userVoteRef}
          post={currentForumEvent.post}
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
