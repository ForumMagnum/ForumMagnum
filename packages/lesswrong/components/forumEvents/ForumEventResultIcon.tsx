import React, { useCallback, useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import classNames from 'classnames';
import { useHover } from '../common/withHover';
import { formatRole } from '../users/EAUserTooltipContent';
import { Link } from '@/lib/reactRouterWrapper';
import { commentGetPageUrlFromIds } from '@/lib/collections/comments/helpers';
import { userGetProfileUrl } from '@/lib/collections/users/helpers';
import { useIsAboveBreakpoint } from '../hooks/useScreenWidth';
import { AnalyticsContext, useTracking } from '@/lib/analyticsEvents';
import { useCurrentForumEvent } from '../hooks/useCurrentForumEvent';

const styles = (theme: ThemeType) => ({
  voteCircle: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    width: "100%",
    marginTop: -5,
    zIndex: 1,
    [theme.breakpoints.down('md')]: {
      marginTop: -3,
    },
    [theme.breakpoints.down('sm')]: {
      marginTop: -1,
    },
  },
  voteTooltipBody: {
    fontSize: 14,
    fontWeight: 500,
    lineHeight: '140%',
  },
  userResultsImage: {
    outline: `2px solid ${theme.palette.text.alwaysWhite}`,
    width: "100% !important",
    height: "unset !important",
  },
  popperContent: {
    margin: "0 12px",
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 13,
    fontWeight: 500,
    lineHeight: '140%',
    padding: 16,
    width: 380,
    maxHeight: 1000,
    color: theme.palette.grey[600],
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.borderRadius.default,
    boxShadow: theme.palette.boxShadow.eaCard,
    display: 'flex',
    flexDirection: 'column',
    gap: "10px",
  },
  pinIcon: {
    width: 12,
    height: 12,
    transform: "rotate(90deg)",
    color: theme.palette.grey[600],
    cursor: "pointer",
    marginBottom: 6,
    "&:hover": {
      opacity: 0.7
    }
  },
  pinIconPinned: {
    transform: "rotate(45deg)",
    color: theme.palette.grey[1000],
  },
  commentBody: {
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 25,
  },
  // User profile header, some of these styles are borrowed from EAUserTooltipContent
  userInfo: {
    display: "flex",
    maxWidth: "100%",
  },
  displayNameRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "8px"
  },
  displayName: {
    fontSize: "1.3rem",
    fontWeight: 600,
    color: theme.palette.grey["A400"],
  },
  headerInfo: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    overflow: "hidden",
    width: "100%",
    "& *": {
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
      overflow: "hidden",
    },
  },
  profileImage: {
    marginRight: 12,
  },
  replyButtonRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  replyButton: {
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    '&:hover': {
      opacity: 0.7
    }
  },
  replyForm: {
    border: theme.palette.border.normal,
    borderRadius: theme.borderRadius.default
  }
});

export type ForumEventVoteDisplay = {
  x: number,
  user: UsersMinimumInfo,
  comment: ShortformComments | null
}

const ForumEventResultIcon = ({
  vote,
  tooltipDisabled,
  classes,
}: {
  vote: ForumEventVoteDisplay;
  tooltipDisabled: boolean;
  classes: ClassesType<typeof styles>;
}) => {
  const { LWTooltip, UsersProfileImage, LWPopper, ForumIcon, CommentBody, LWClickAwayListener, CommentsNewForm } =
    Components;

  const isDesktop = useIsAboveBreakpoint("md")
  const { captureEvent } = useTracking();
  const { currentForumEvent } = useCurrentForumEvent();

  const [replyFormOpen, setReplyFormOpen] = useState(false);

  const { user, comment } = vote;

  const role = formatRole(user.jobTitle, user.organization)

  const {eventHandlers, hover, anchorEl} = useHover();

  const [isPinned, setIsPinned] = useState(false)
  // We only need to show the count, so just track comments the user submits rather
  // than refetching
  const [newRepliesCount, setNewRepliesCount] = useState(0);

  const replySuccessCallback = useCallback(() => {
    captureEvent("replyFromBanner")
    setNewRepliesCount((prev) => prev + 1);
    setReplyFormOpen(false);
  }, [captureEvent])

  const repliesCount = (comment?.descendentCount ?? 0) + newRepliesCount;

  const popperOpen = hover || isPinned

  const replyString = repliesCount
    ? `(${repliesCount} ${repliesCount === 1 ? "reply" : "replies"})`
    : "";

  if (!isDesktop) return null;

  return (
    <AnalyticsContext
      pageElementContext="forumEventResultIcon"
      forumEventId={currentForumEvent?._id}
      userIdDisplayed={vote.user._id}
    >
      <div key={vote.user._id} className={classes.voteCircle} {...eventHandlers}>
        <LWTooltip
          title={<div className={classes.voteTooltipBody}>{vote.user.displayName}</div>}
          disabled={!!vote.comment}
        >
          <UsersProfileImage
            user={vote.user}
            // The actual size gets overridden by the styles above. This
            // is still needed to get the right resolution from Cloudinary
            size={34}
            className={classes.userResultsImage}
          />
        </LWTooltip>
        {!tooltipDisabled && comment && (
          <LWPopper
            open={popperOpen}
            anchorEl={anchorEl}
            clickable={true}
            allowOverflow={false}
            placement={"right-start"}
          >
            <LWClickAwayListener onClickAway={() => setIsPinned(false)}>
              <div className={classes.popperContent}>
                <div className={classes.userInfo}>
                  <UsersProfileImage user={user} size={40} className={classes.profileImage} />
                  <div className={classes.headerInfo}>
                    <div className={classes.displayNameRow}>
                      <Link
                        className={classes.displayName}
                        to={userGetProfileUrl(user)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {user.displayName}
                      </Link>
                      <ForumIcon
                        icon="Pin"
                        onClick={() => setIsPinned(!isPinned)}
                        className={classNames(classes.pinIcon, { [classes.pinIconPinned]: isPinned })}
                      />
                    </div>
                    <div>{role}</div>
                  </div>
                </div>
                <CommentBody comment={comment} className={classes.commentBody} />
                <div
                  className={classes.replyButtonRow}
                  onClick={() => {
                    setReplyFormOpen(true);
                    // Pin even after the comment is submitted so they can see the result
                    setIsPinned(true);
                  }}
                >
                  <div className={classes.replyButton}>Reply</div>
                  <Link
                    to={commentGetPageUrlFromIds({ postId: comment.postId, commentId: comment._id })}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Go to thread {replyString}
                  </Link>
                </div>
                {replyFormOpen && (
                  <CommentsNewForm
                    type="reply"
                    post={comment.post ?? undefined}
                    parentComment={comment}
                    cancelCallback={() => setReplyFormOpen(false)}
                    successCallback={replySuccessCallback}
                    className={classes.replyForm}
                  />
                )}
              </div>
            </LWClickAwayListener>
          </LWPopper>
        )}
      </div>
    </AnalyticsContext>
  );
};

const ForumEventResultIconComponent = registerComponent(
  'ForumEventResultIcon',
  ForumEventResultIcon,
  { styles }
);

declare global {
  interface ComponentTypes {
    ForumEventResultIcon: typeof ForumEventResultIconComponent;
  }
}
