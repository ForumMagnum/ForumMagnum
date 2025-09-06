import React from "react";
import { isNotificationTypeName } from "@/lib/notificationTypes";
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

const iconStyles = {
  margin: 16,
  fontSize: 20,
};

const flatIconStyles = {
  margin: 16,
  height: 20,
  width: 26,
};

export function getNotificationIconByNotificationName(notificationName: string) {
  if (!isNotificationTypeName(notificationName)) {
    return null;
  }

  switch (notificationName) {
    case 'newPost': return <PostsIcon style={iconStyles}/>;
    case 'newUserComment': return <CommentsIcon style={iconStyles}/>;
    case 'postApproved': return <ForumIcon icon="Bell" style={iconStyles} />;
    case 'postNominated': return <ForumIcon icon="Star" style={iconStyles} />;
    case 'newEvent': return <ForumIcon icon="Bell" style={iconStyles} />;
    case 'newGroupPost': return <ForumIcon icon="Bell" style={iconStyles} />;
    case 'newComment': return <CommentsIcon style={iconStyles}/>;
    case 'newSubforumComment': return <CommentsIcon style={iconStyles}/>;
    case 'newDialogueMessages': return <DebateIcon style={iconStyles}/>;
    case 'newDialogueBatchMessages': return <DebateIcon style={iconStyles}/>;
    case 'newPublishedDialogueMessages': return <DebateIcon style={iconStyles}/>;
    case 'newDialogueMatch': return <DebateIcon style={iconStyles}/>;
    case 'newDialogueChecks': return <DebateIcon style={iconStyles}/>;
    case 'yourTurnMatchForm': return <DebateIcon style={iconStyles}/>;
    case 'newDebateComment': return <CommentsIcon style={iconStyles}/>;
    case 'newDebateReply': return <DebateIcon style={iconStyles}/>;
    case 'newShortform': return <CommentsIcon style={iconStyles}/>;
    case 'newTagPosts': return <PostsIcon style={iconStyles}/>;
    case 'newSequencePosts': return <PostsIcon style={iconStyles}/>;
    case 'newReply': return <CommentsIcon style={iconStyles}/>;
    case 'newReplyToYou': return <CommentsIcon style={iconStyles}/>;
    case 'newUser': return <ForumIcon icon="Bell" style={iconStyles} />;
    case 'newMessage': return <MailIcon style={iconStyles}/>;
    case 'wrapped': return <GiftIcon style={flatIconStyles}/>;
    case 'emailVerificationRequired': return <ForumIcon icon="Bell" style={iconStyles} />;
    case 'postSharedWithUser': return <ForumIcon icon="Bell" style={iconStyles} />;
    case 'addedAsCoauthor': return <GroupAddIcon style={iconStyles} />;
    case 'alignmentSubmissionApproved': return <ForumIcon icon="Bell" style={iconStyles} />;
    case 'newEventInRadius': return <EventIcon style={iconStyles} />;
    case 'editedEventInRadius': return <EventIcon style={iconStyles} />;
    case 'newRSVP': return <EventIcon style={iconStyles} />;
    case 'karmaPowersGained': return <ForumIcon icon="Bell" style={iconStyles} />;
    case 'cancelledRSVP': return <EventIcon style={iconStyles} />;
    case 'newGroupOrganizer': return <SupervisedUserCircleIcon style={iconStyles} />;
    case 'newSubforumMember': return <SupervisedUserCircleIcon style={iconStyles} />;
    case 'newCommentOnDraft': return <CommentsIcon style={iconStyles}/>;
    case 'coauthorRequestNotification': return <GroupAddIcon style={iconStyles} />;
    case 'coauthorAcceptNotification': return <DoneIcon style={iconStyles} />;
    case 'newMention': return <CommentsIcon style={iconStyles}/>;

    default: return null;
  }
}
