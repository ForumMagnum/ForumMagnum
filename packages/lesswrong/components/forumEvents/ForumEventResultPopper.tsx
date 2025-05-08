import React, { useCallback, useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames';
import { formatRole } from '../users/EAUserTooltipContent';
import { Link } from '@/lib/reactRouterWrapper';
import { commentGetPageUrlFromIds } from '@/lib/collections/comments/helpers';
import { userGetProfileUrl } from '@/lib/collections/users/helpers';
import { InteractionWrapper } from '../common/useClickableCell';
import type { Placement as PopperPlacementType } from "popper.js"
import { LWPopper } from "../common/LWPopper";
import { LWClickAwayListener } from "../common/LWClickAwayListener";
import { ForumIcon } from "../common/ForumIcon";
import { CommentBody } from "../comments/CommentsItem/CommentBody";
import { CommentsNewForm } from "../comments/CommentsNewForm";
import { UsersProfileImage } from "../users/UsersProfileImage";

const styles = (theme: ThemeType) => ({
  popperContent: {
    margin: "0 12px",
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 13,
    fontWeight: 500,
    lineHeight: "140%",
    padding: 16,
    maxWidth: 380,
    maxHeight: 1000,
    color: theme.palette.grey[600],
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.borderRadius.default,
    boxShadow: theme.palette.boxShadow.eaCard,
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  // User profile header, some of these styles are borrowed from EAUserTooltipContent
  userInfo: {
    display: "flex",
    maxWidth: "100%",
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
  displayNameRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px"
  },
  displayName: {
    paddingBottom: 1,
    fontSize: "1.3rem",
    fontWeight: 600,
    color: theme.palette.grey["A400"],
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

const ForumEventResultPopperInner = ({
  anchorEl,
  user,
  comment,
  captureEvent,
  setIsPinned,
  isPinned,
  newRepliesCount,
  setNewRepliesCount,
  placement="right-start",
  className,
  classes,
}: {
  anchorEl: any,
  user: UsersMinimumInfo;
  comment: ShortformComments;
  captureEvent: Function;
  setIsPinned: React.Dispatch<React.SetStateAction<boolean>>;
  isPinned: boolean;
  newRepliesCount: number;
  setNewRepliesCount: React.Dispatch<React.SetStateAction<number>>;
  placement?: PopperPlacementType | undefined;
  className?: string;
  classes: ClassesType<typeof styles>;
}) => {
  const [replyFormOpen, setReplyFormOpen] = useState(false);

  const replySuccessCallback = useCallback(() => {
    captureEvent("replyFromBanner")
    // We only need to show the count, so just track comments the user submits rather than refetching
    setNewRepliesCount((prev) => prev + 1);
    setReplyFormOpen(false);
  }, [captureEvent, setNewRepliesCount])

  const repliesCount = (comment?.descendentCount ?? 0) + newRepliesCount;

  const replyString = repliesCount
    ? `(${repliesCount} ${repliesCount === 1 ? "reply" : "replies"})`
    : "";

  const role = formatRole(user.jobTitle, user.organization);

  return (
    <LWPopper
      open={true}
      anchorEl={anchorEl}
      clickable={true}
      flip={true}
      placement={placement}
    >
      <LWClickAwayListener onClickAway={() => setIsPinned(false)}>
        <InteractionWrapper>
          <div className={classNames(className, classes.popperContent)}>
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
            <div className={classes.replyButtonRow}>
              <div
                className={classes.replyButton}
                onClick={() => {
                  setReplyFormOpen(true);
                  // Pin even after the comment is submitted so they can see the result
                  setIsPinned(true);
                }}
              >
                Reply
              </div>
              <Link
                to={commentGetPageUrlFromIds({ postId: comment.postId, commentId: comment._id })}
                target="_blank"
                rel="noopener noreferrer"
                className={classes.replyButton}
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
        </InteractionWrapper>
      </LWClickAwayListener>
    </LWPopper>
  );
};

export const ForumEventResultPopper = registerComponent(
  'ForumEventResultPopper',
  ForumEventResultPopperInner,
  { styles, stylePriority: -1 }
);

declare global {
  interface ComponentTypes {
    ForumEventResultPopper: typeof ForumEventResultPopper;
  }
}
