import { useMulti } from "@/lib/crud/withMulti";
import { gql, useMutation } from "@apollo/client";
import React, { FC, useCallback, useMemo, useRef, useState } from "react";
import { useLoginPopoverContext } from "../hooks/useLoginPopoverContext";
import { useCurrentUser } from "../common/withUser";
import { Components, registerComponent } from "@/lib/vulcan-lib";
import { useCurrentForumEvent } from "../hooks/useCurrentForumEvent";
import classNames from "classnames";
import { commentGetPageUrlFromIds } from "@/lib/collections/comments/helpers";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { Link } from "@/lib/reactRouterWrapper";
import { InteractionWrapper } from "../common/useClickableCell";
import { useIsAboveBreakpoint } from "../hooks/useScreenWidth";
import { AnalyticsContext } from "@/lib/analyticsEvents";

const styles = (theme: ThemeType) => ({
  heartsContainer: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  hoverHeart: {
    opacity: 0.5,
    pointerEvents: "none",
    [theme.breakpoints.down('xs')]: {
      display: "none"
    },
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
}): { currentUserHeart: ForumEventStickerDisplay | null, otherHearts: ForumEventStickerDisplay[] } {
  if (!users || !data) {
    return { currentUserHeart: null, otherHearts: [] };
  }

  const allHearts = users
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

  const currentUserHeart = allHearts.find(heart => currentUser && heart.user._id === currentUser._id) || null;
  const otherHearts = allHearts.filter(heart => !currentUser || heart.user._id !== currentUser._id);

  return { currentUserHeart, otherHearts };
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
  const [mobilePlacingHeart, setMobilePlacingHeart] = useState(false)

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

  const { currentUserHeart, otherHearts } = useMemo(
    () => stickerDataToArray({ data: stickerData, users, comments, currentUser }),
    [comments, currentUser, stickerData, users]
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

  const allowPlacingHeart = !currentUserHeart && (isDesktop || mobilePlacingHeart);

  const saveStickerPos = useCallback(
    async (event: React.MouseEvent) => {
      if (!currentForumEvent || !allowPlacingHeart) return;

      if (currentUser) {
        const coords = normalizeCoords(event.clientX, event.clientY);

        if (!coords || currentUserHeart) return;

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
        setMobilePlacingHeart(false);
        refetch?.();
      } else {
        onSignup();
      }
    },
    [currentForumEvent, allowPlacingHeart, currentUser, normalizeCoords, currentUserHeart, addSticker, hoverTheta, refetch, onSignup]
  );

  const clearSticker = useCallback(async () => {
    if (!currentForumEvent) return;

    await removeSticker({ variables: { forumEventId: currentForumEvent!._id } });
    refetch?.();
  }, [currentForumEvent, refetch, removeSticker])

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!allowPlacingHeart) return;

      const coords = normalizeCoords(event.clientX, event.clientY);
      if (coords) {
        setHoverPos(coords);
      } else {
        setHoverPos(null);
      }
    },
    [normalizeCoords, allowPlacingHeart]
  );

  const handleMouseLeave = useCallback(() => {
    if (!allowPlacingHeart) return;

    setHoverPos(null);
  }, [allowPlacingHeart]);

  if (!currentForumEvent) return null;

  return (
    <AnalyticsContext pageElementContext="forumEventStickers">
      <div
        className={classes.heartsContainer}
        ref={containerRef}
        {...(interactive && {
          onMouseMove: handleMouseMove,
          onMouseLeave: handleMouseLeave,
          onClick: saveStickerPos,
        })}
      >
        {allowPlacingHeart && hoverPos && (
          <ForumEventSticker
            x={hoverPos.x}
            y={hoverPos.y}
            theta={hoverTheta}
            icon="Heart"
            className={classes.hoverHeart}
          />
        )}
        {currentUserHeart && (
          <ForumEventSticker
            {...currentUserHeart}
            tooltipDisabled={commentFormOpen}
            icon="Heart"
            ref={setUserVoteRef}
            onClear={clearSticker}
          />
        )}
        {otherHearts.map((heart, index) => (
          <ForumEventSticker key={index} {...heart} icon="Heart" />
        ))}
        {!isDesktop && !currentUserHeart && (
          <InteractionWrapper>
            <div className={classes.placeHeartButton} onClick={() => setMobilePlacingHeart(!mobilePlacingHeart)}>
              {mobilePlacingHeart ? "...placing heart (click to cancel)" : "+ Place heart"}
            </div>
          </InteractionWrapper>
        )}
      </div>
      {currentForumEvent.post && (
        <ForumEventCommentForm
          open={commentFormOpen}
          comment={currentUserHeart?.comment || null}
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
