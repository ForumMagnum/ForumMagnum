import { useMulti } from "@/lib/crud/withMulti";
import { gql, useMutation } from "@apollo/client";
import React, { FC, useCallback, useMemo, useRef, useState } from "react";
import { useLoginPopoverContext } from "../hooks/useLoginPopoverContext";
import { useCurrentUser } from "../common/withUser";
import { Components, registerComponent } from "@/lib/vulcan-lib";
import { useCurrentForumEvent } from "../hooks/useCurrentForumEvent";
import classNames from "classnames";
import { ForumIconName } from "../common/ForumIcon";
import { useTracking } from "@/lib/analyticsEvents";
import { useHover } from "../common/withHover";
import { commentGetPageUrlFromIds } from "@/lib/collections/comments/helpers";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { Link } from "@/lib/reactRouterWrapper";
import { InteractionWrapper } from "../common/useClickableCell";

const styles = (theme: ThemeType) => ({
  heartsContainer: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  heart: {
    color: theme.palette.givingSeason.heart,
    position: "absolute",
    transformOrigin: "center",
    "& svg": {
      fontSize: 20,
      [theme.breakpoints.down('xs')]: {
        fontSize: 16
      },
    }
  },
  hoverHeart: {
    opacity: 0.5,
    pointerEvents: "none",
    [theme.breakpoints.down('xs')]: {
      display: "none"
    },
  },
  clearSticker: {
    top: -1,
    right: -3,
    position: "absolute",
    backgroundColor: `color-mix(in oklab, ${theme.palette.text.alwaysBlack} 65%, ${theme.palette.text.alwaysWhite} 35%)`,
    padding: 2,
    borderRadius: "50%",
    cursor: "pointer",
    width: 10,
    height: 10,
    fontSize: 9,
    "&:hover": {
      backgroundColor: theme.palette.text.alwaysBlack,
    },
    [theme.breakpoints.down('xs')]: {
      top: -2,
      right: -4,
    },
  },
  cross: {
    color: theme.palette.text.alwaysWhite,
    opacity: 0.8,
    position: "absolute",
    fontSize: 12,
    top: -4,
    left: 1
  },
  commentPopper: {
    margin: "0 8px"
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

// TODO use these on the backend
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

type ForumEventStickerProps = {
  x: number;
  y: number;
  theta: number;
  user?: UsersMinimumInfo;
  comment?: ShortformComments | null;
  icon?: ForumIconName;
  tooltipDisabled?: boolean;
  onClear?: () => void;
  className?: string;
};
const ForumEventSticker = React.forwardRef<
  HTMLDivElement,
  ForumEventStickerProps & { classes: ClassesType<typeof styles> }
>(({ x, y, theta, user, comment, icon = "Heart", tooltipDisabled, onClear, className, classes }, ref) => {
  const { ForumIcon, ForumEventResultPopper } = Components;

  // TODO de-dup with ForumEventResultIcon
  // TODO decide on a width to stop showing them
  const isDesktop = true;

  const { captureEvent } = useTracking();
  const { currentForumEvent } = useCurrentForumEvent();

  const { eventHandlers, hover, anchorEl } = useHover();

  const [isPinned, setIsPinned] = useState(false);
  const [newRepliesCount, setNewRepliesCount] = useState(0);

  const popperOpen = hover || isPinned;

  if (!isDesktop) return null;

  return (
    <InteractionWrapper>
      <div
        className={classNames(classes.heart, className)}
        ref={ref}
        style={{
          left: `${x * 100}%`,
          top: `${y * 100}%`,
          transform: `rotate(${theta}deg) translate(-50%, -50%)`,
        }}
        {...eventHandlers}
      >
        {/* onPointerDown rather than onClick because the button is very small */}
        {onClear && (
          <div className={classes.clearSticker} onPointerDown={onClear}>
            <div className={classes.cross}>&times;</div>
          </div>
        )}
        <ForumIcon icon={icon} />
        {/* TODO this doesn't work well on mobile */}
        {!tooltipDisabled && user && comment && popperOpen && (
          <ForumEventResultPopper
            anchorEl={anchorEl}
            user={user}
            comment={comment}
            captureEvent={captureEvent}
            setIsPinned={setIsPinned}
            isPinned={isPinned}
            newRepliesCount={newRepliesCount}
            setNewRepliesCount={setNewRepliesCount}
            className={classes.commentPopper}
          />
        )}
      </div>
    </InteractionWrapper>
  );
});

const ForumEventStickers: FC<{
  interactive: boolean;
  classes: ClassesType<typeof styles>;
}> = ({ interactive, classes }) => {
  const { ForumEventCommentForm } = Components;

  const { currentForumEvent, refetch } = useCurrentForumEvent();
  const { onSignup } = useLoginPopoverContext();
  const currentUser = useCurrentUser();

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

  const showHoverHeart = !currentUserHeart;

  const saveStickerPos = useCallback(
    async (event: React.MouseEvent) => {
      if (!currentForumEvent) return;

      // When a logged-in user is done dragging their vote, attempt to save it
      if (currentUser) {
        const coords = normalizeCoords(event.clientX, event.clientY);

        if (!coords || currentUserHeart) return;

        if (currentForumEvent.post) {
          setCommentFormOpen(true);
        }

        console.log("Adding sticker", { coords });

        // setCurrentUserVote(newVotePos);
        await addSticker({
          variables: {
            ...coords,
            theta: hoverTheta,
            forumEventId: currentForumEvent._id,
          },
        });
        // TODO handle the user's vote changing faster than this
        refetch?.();
      } else {
        onSignup();
      }
    },
    [currentForumEvent, currentUser, normalizeCoords, currentUserHeart, addSticker, hoverTheta, refetch, onSignup]
  );

  const clearSticker = useCallback(async () => {
    if (!currentForumEvent) return;

    await removeSticker({ variables: { forumEventId: currentForumEvent!._id } });
    refetch?.();
  }, [currentForumEvent, refetch, removeSticker])

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!showHoverHeart) return;

      const coords = normalizeCoords(event.clientX, event.clientY);
      if (coords) {
        setHoverPos(coords);
      } else {
        setHoverPos(null);
      }
    },
    [normalizeCoords, showHoverHeart]
  );

  const handleMouseLeave = useCallback(() => {
    if (!showHoverHeart) return;

    setHoverPos(null);
  }, [showHoverHeart]);

  if (!currentForumEvent) return null;

  return (
    // TODO analytics
    <>
      <div
        className={classes.heartsContainer}
        ref={containerRef}
        {...(interactive && {
          onMouseMove: handleMouseMove,
          onMouseLeave: handleMouseLeave,
          onClick: saveStickerPos,
        })}
      >
        {showHoverHeart && hoverPos && (
          <ForumEventSticker
            x={hoverPos.x}
            y={hoverPos.y}
            theta={hoverTheta}
            icon="Heart"
            className={classNames(classes.heart, classes.hoverHeart)}
            classes={classes}
          />
        )}
        {currentUserHeart && (
          <ForumEventSticker
            {...currentUserHeart}
            tooltipDisabled={commentFormOpen}
            icon="Heart"
            className={classes.heart}
            ref={setUserVoteRef}
            onClear={clearSticker}
            classes={classes}
          />
        )}
        {otherHearts.map((heart, index) => (
          <ForumEventSticker
            key={index}
            {...heart}
            icon="Heart"
            className={classes.heart}
            classes={classes}
          />
        ))}
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
          subtitle={(post, comment) => (<>
            <div>
              Your response will appear as a comment on{" "}
              <Link to={comment ? commentGetPageUrlFromIds({postId: comment.postId, commentId: comment._id}) : postGetPageUrl(post)} target="_blank" rel="noopener noreferrer">
                this post
              </Link>
              , and show on hover on this banner.
            </div>
          </>)}
        />
      )}
    </>
  );
};

const ForumEventStickersComponent = registerComponent( 'ForumEventStickers', ForumEventStickers, {styles});

export default ForumEventStickersComponent;

declare global {
  interface ComponentTypes {
    ForumEventStickers: typeof ForumEventStickersComponent;
  }
}
