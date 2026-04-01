import { getSiteUrl } from '../../lib/vulcan-lib/utils';
import classNames from 'classnames';
import React, { FC, ReactNode, useCallback, useState } from 'react';
import { Card } from "@/components/widgets/Paper";
import { getNotificationTypeByName } from '../../lib/notificationTypes';
import { parseRouteWithErrors } from '@/lib/routeChecks/parseRouteWithErrors';
import { useTracking } from '../../lib/analyticsEvents';
import { useNavigate } from '../../lib/routeUtil';
import { getUrlClass } from '@/server/utils/getUrlClass';
import LWTooltip from "../common/LWTooltip";
import PostsTooltip from "../posts/PostsPreviewTooltip/PostsTooltip";
import ConversationPreview from "../messaging/ConversationPreview";
import PostNominatedNotification from "../review/PostNominatedNotification";
import TagRelNotificationItem from "./TagRelNotificationItem";
import { onsiteHoverViewComponents } from '@/lib/notificationTypeComponents';
import FormatDate from '../common/FormatDate';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import PostsIcon from '@/lib/vendor/@material-ui/icons/src/Description';
import CommentsIcon from '@/lib/vendor/@material-ui/icons/src/ModeComment';
import EventIcon from '@/lib/vendor/@material-ui/icons/src/Event';
import MailIcon from '@/lib/vendor/@material-ui/icons/src/Mail';
import SupervisedUserCircleIcon from '@/lib/vendor/@material-ui/icons/src/SupervisedUserCircle';
import GroupAddIcon from '@/lib/vendor/@material-ui/icons/src/GroupAdd';
import DoneIcon from '@/lib/vendor/@material-ui/icons/src/Done';
import DebateIcon from '@/lib/vendor/@material-ui/icons/src/Forum';
import ForumIcon from '@/components/common/ForumIcon';
import { GiftIcon } from '../icons/giftIcon';
import { isNotificationTypeName } from '@/lib/notificationTypes';

const styles = defineStyles('NotificationsPageItem', (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center",
    textDecoration: "none",
    color: "inherit",
    padding: '10px 16px 10px 0',
    borderBottom: theme.palette.border.faint,
    transition: "background-color 80ms ease",
    "&:hover": {
      backgroundColor: theme.palette.greyAlpha(0.07),
    },
  },
  read: {
    opacity: 0.7,
    "&:hover": {
      opacity: 1,
    },
  },
  unread: {
    opacity: 1,
  },
  iconWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    width: 48,
    color: theme.palette.icon.dim4,
  },
  unreadDot: {
    position: "absolute",
    left: 6,
    top: "50%",
    transform: "translateY(-50%)",
    width: 6,
    height: 6,
    borderRadius: "50%",
    backgroundColor: theme.palette.primary.main,
  },
  dotContainer: {
    position: "relative",
  },
  content: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    alignItems: "baseline",
    gap: 12,
  },
  notificationLabel: {
    ...theme.typography.body2,
    fontSize: 14,
    lineHeight: "20px",
    color: theme.palette.text.normal,
    flex: 1,
    minWidth: 0,

    // Two-line ellipsis hack. Webkit-specific (doesn't work in Firefox),
    // inherited from old-Material-UI (where it also doesn't work in Firefox,
    // the symptom being that the ellipses are missing but the layout is
    // otherwise fine).
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    "-webkit-line-clamp": 2,
    "-webkit-box-orient": "vertical",
  },
  notificationLabelRead: {
    color: theme.palette.text.dim55,
  },
  timestamp: {
    ...theme.typography.body2,
    fontSize: 12,
    lineHeight: "20px",
    color: theme.palette.text.dim55,
    flexShrink: 0,
    whiteSpace: "nowrap",
  },
  preview: {
    [theme.breakpoints.down('xs')]: {
      display: "none",
    },
  },
}));

const iconStyle = { fontSize: 20 };
const flatIconStyle = { height: 20, width: 26 };

function getPageNotificationIcon(notificationName: string) {
  if (!isNotificationTypeName(notificationName)) {
    return null;
  }
  switch (notificationName) {
    case 'newPost': return <PostsIcon style={iconStyle}/>;
    case 'newUserComment': return <CommentsIcon style={iconStyle}/>;
    case 'postApproved': return <ForumIcon icon="Bell" style={iconStyle} />;
    case 'postNominated': return <ForumIcon icon="Star" style={iconStyle} />;
    case 'newEvent': return <ForumIcon icon="Bell" style={iconStyle} />;
    case 'newGroupPost': return <ForumIcon icon="Bell" style={iconStyle} />;
    case 'newComment': return <CommentsIcon style={iconStyle}/>;
    case 'newSubforumComment': return <CommentsIcon style={iconStyle}/>;
    case 'newDialogueMessages': return <DebateIcon style={iconStyle}/>;
    case 'newDialogueBatchMessages': return <DebateIcon style={iconStyle}/>;
    case 'newPublishedDialogueMessages': return <DebateIcon style={iconStyle}/>;
    case 'newDialogueMatch': return <DebateIcon style={iconStyle}/>;
    case 'newDialogueChecks': return <DebateIcon style={iconStyle}/>;
    case 'yourTurnMatchForm': return <DebateIcon style={iconStyle}/>;
    case 'newDebateComment': return <CommentsIcon style={iconStyle}/>;
    case 'newDebateReply': return <DebateIcon style={iconStyle}/>;
    case 'newShortform': return <CommentsIcon style={iconStyle}/>;
    case 'newTagPosts': return <PostsIcon style={iconStyle}/>;
    case 'newSequencePosts': return <PostsIcon style={iconStyle}/>;
    case 'newReply': return <CommentsIcon style={iconStyle}/>;
    case 'newReplyToYou': return <CommentsIcon style={iconStyle}/>;
    case 'newUser': return <ForumIcon icon="Bell" style={iconStyle} />;
    case 'newMessage': return <MailIcon style={iconStyle}/>;
    case 'wrapped': return <GiftIcon style={flatIconStyle}/>;
    case 'emailVerificationRequired': return <ForumIcon icon="Bell" style={iconStyle} />;
    case 'postSharedWithUser': return <ForumIcon icon="Bell" style={iconStyle} />;
    case 'addedAsCoauthor': return <GroupAddIcon style={iconStyle} />;
    case 'alignmentSubmissionApproved': return <ForumIcon icon="Bell" style={iconStyle} />;
    case 'newEventInRadius': return <EventIcon style={iconStyle} />;
    case 'editedEventInRadius': return <EventIcon style={iconStyle} />;
    case 'newRSVP': return <EventIcon style={iconStyle} />;
    case 'karmaPowersGained': return <ForumIcon icon="Bell" style={iconStyle} />;
    case 'cancelledRSVP': return <EventIcon style={iconStyle} />;
    case 'newGroupOrganizer': return <SupervisedUserCircleIcon style={iconStyle} />;
    case 'newCommentOnDraft': return <CommentsIcon style={iconStyle}/>;
    case 'coauthorRequestNotification': return <GroupAddIcon style={iconStyle} />;
    case 'coauthorAcceptNotification': return <DoneIcon style={iconStyle} />;
    case 'newMention': return <CommentsIcon style={iconStyle}/>;
    default: return null;
  }
}

const tooltipProps = {
  placement: "left-start",
  pageElementContext: "linkPreview",
  pageElementSubContext: "notificationItem",
  clickable: true,
} as const;

const TooltipWrapper: FC<{
  title: ReactNode,
  children: ReactNode,
}> = ({title, children}) => {
  const classes = useStyles(styles);
  return (
    <LWTooltip
      {...tooltipProps}
      tooltip={false}
      title={
        <span className={classes.preview}>
          <Card>{title}</Card>
        </span>
      }
    >
      {children}
    </LWTooltip>
  );
};

const NotificationsPageItem = ({notification, lastNotificationsCheck}: {
  notification: NotificationsList,
  lastNotificationsCheck: string,
}) => {
  const classes = useStyles(styles);
  const [clicked, setClicked] = useState(false);
  const { captureEvent } = useTracking();
  const navigate = useNavigate();
  const notificationType = getNotificationTypeByName(notification.type ?? '');
  const documentId = notification.documentId ?? '';

  const isRead = ((!notification.createdAt || notification.createdAt < lastNotificationsCheck) || clicked);

  const notificationLink = (notificationType.getLink
    ? notificationType.getLink({
      documentType: notification.documentType,
      documentId: notification.documentId,
      extraData: notification.extraData,
    })
    : notification.link ?? ''
  );

  const PreviewTooltip: FC<{children: ReactNode}> = useCallback(({children}) => {
    const OnsiteHoverView = onsiteHoverViewComponents[notificationType.name]?.() ?? null;
    if (OnsiteHoverView) {
      return (
        <TooltipWrapper title={<OnsiteHoverView notification={notification}/>}>
          {children}
        </TooltipWrapper>
      );
    }

    if (notification.type === "postNominated") {
      return (
        <TooltipWrapper title={<PostNominatedNotification postId={documentId}/>}>
          {children}
        </TooltipWrapper>
      );
    }

    if (notification.type === "newDialogueMessages") {
      const dialogueMessageInfo = notification.extraData?.dialogueMessageInfo;
      const postId = notification.documentId ?? undefined;
      return (
        <PostsTooltip postId={postId} dialogueMessageInfo={dialogueMessageInfo} {...tooltipProps}>
          {children}
        </PostsTooltip>
      );
    }

    const parsedPath = parseRouteWithErrors(notificationLink);
    switch (notification.documentType) {
      case "tagRel":
        return (
          <PostsTooltip tagRelId={documentId} {...tooltipProps}>
            {children}
          </PostsTooltip>
        );
      case "post":
        return (
          <PostsTooltip postId={documentId} {...tooltipProps}>
            {children}
          </PostsTooltip>
        );
      case "comment": {
        const postId = parsedPath?.params?._id;
        return postId
          ? (
            <PostsTooltip postId={postId} commentId={documentId} {...tooltipProps}>
              {children}
            </PostsTooltip>
          )
          : <>{children}</>;
      }
      case "message":
        return (
          <TooltipWrapper
            title={<ConversationPreview conversationId={parsedPath?.query?.conversation} messageId={documentId} count={1} />}
          >
            {children}
          </TooltipWrapper>
        );
      default:
        break;
    }

    return <>{children}</>;
  }, [notification, notificationLink, notificationType, documentId]);

  const renderMessage = () => {
    switch (notification.documentType) {
      case 'tagRel':
        return <TagRelNotificationItem tagRelId={documentId}/>;
      default:
        return notification.message;
    }
  };

  return (
    <li className={classes.dotContainer}>
      {!isRead && <span className={classes.unreadDot} />}
      <PreviewTooltip>
        <a
          href={notificationLink}
          className={classNames(
            classes.root,
            {
              [classes.read]: isRead,
              [classes.unread]: !isRead,
            }
          )}
          onClick={(ev) => {
            if (ev.button > 0 || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.metaKey)
              return;

            captureEvent("notificationItemClick", {
              notification: {
                _id: notification._id,
                type: notification.type,
                documentId: notification.documentId,
                documentType: notification.documentType,
                link: notification.link,
              }
            });

            ev.preventDefault();
            navigate(notificationLink);
            setClicked(true);

            const UrlClass = getUrlClass();
            const url = new UrlClass(notificationLink, getSiteUrl());
            const hash = url.hash;
            if (hash) {
              const element = document.getElementById(hash.substring(1));
              if (element) element.scrollIntoView({ behavior: "smooth" });
            }
          }}
        >
          <span className={classes.iconWrapper}>
            {notification.type ? getPageNotificationIcon(notification.type) : null}
          </span>
          <div className={classes.content}>
            <div className={classNames(classes.notificationLabel, {
              [classes.notificationLabelRead]: isRead,
            })}>
              {renderMessage()}
            </div>
            {notification.createdAt && (
              <span className={classes.timestamp}>
                <FormatDate date={notification.createdAt} tooltip={true} />
              </span>
            )}
          </div>
        </a>
      </PreviewTooltip>
    </li>
  );
};

export default NotificationsPageItem;
