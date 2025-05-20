import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { conversationGetTitle } from '../../lib/collections/conversations/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { postsItemLikeStyles } from '../localGroups/LocalGroupsItem'
import ArchiveIcon from '@/lib/vendor/@material-ui/icons/src/Archive';
import UnarchiveIcon from '@/lib/vendor/@material-ui/icons/src/Unarchive';
import classNames from 'classnames'
import * as _ from 'underscore';
import { TooltipSpan } from '../common/FMTooltip';
import PostsItem2MetaInfo from "../posts/PostsItem2MetaInfo";
import UsersName from "../users/UsersName";
import FormatDate from "../common/FormatDate";
import ConversationPreview from "./ConversationPreview";

const styles = (theme: ThemeType) => ({
  ...postsItemLikeStyles(theme),
  wrap: {
    flexWrap: "wrap",
  },
  titleLineHeight: {
    lineHeight: "1.5em",
  },
  leftMargin: {
    marginLeft: theme.spacing.unit * 2
  },
  archivedItem: {
    opacity: 0.5
  },
  commentFont: {
    ...theme.typography.commentStyle
  },
  expanded: {
    background: theme.palette.background.pageActiveAreaBackground,
    marginBottom: 20,
    padding: 16
  },
  boxShadow: {
    boxShadow: theme.palette.boxShadow.faint,
  },
});

const ConversationItem = ({conversation, updateConversation, currentUser, classes, expanded}: {
  conversation: ConversationsList,
  updateConversation: any,
  currentUser: UsersCurrent,
  classes: ClassesType<typeof styles>,
  expanded?: boolean
}) => {
  const isArchived = conversation?.archivedByIds?.includes(currentUser._id)
  if (!conversation) return null

  const archiveIconClick = () => {
    const newArchivedByIds = isArchived ?
      _.without(conversation.archivedByIds || [] , currentUser._id) :
      [...(conversation.archivedByIds || []), currentUser._id]

    updateConversation({
      selector: { _id: conversation._id },
      data: {archivedByIds: newArchivedByIds}
    })
  }

  return (
    <div className={expanded ? classes.boxShadow : undefined}>
      <div className={classNames(classes.root, classes.wrap, {[classes.archivedItem]: isArchived})}>
        <Link to={`/inbox/${conversation._id}`} className={classNames(classes.title, classes.titleLineHeight, classes.commentFont)}>{conversationGetTitle(conversation, currentUser)}</Link>
        { conversation.participants
          ?.filter(user => user._id !== currentUser._id)
          .map(user => <span key={user._id} className={classes.leftMargin}>
            <PostsItem2MetaInfo> <UsersName user={user} /> </PostsItem2MetaInfo>
          </span>)
        }
        {conversation.latestActivity && <span className={classes.leftMargin}><PostsItem2MetaInfo>
          <FormatDate date={conversation.latestActivity} />
        </PostsItem2MetaInfo></span>}
        {<div className={classes.actions} onClick={archiveIconClick}>
          <TooltipSpan title={isArchived ? "Restore this conversation" : "Archive this conversation"} className={classes.leftMargin}>
            {isArchived ? <UnarchiveIcon /> : <ArchiveIcon />}
          </TooltipSpan>
        </div>}
    </div>
      {expanded && <div className={classes.expanded}>
        <ConversationPreview count={3} key={conversation._id} conversationId={conversation._id} currentUser={currentUser} showTitle={false} />
      </div>}
    </div>
  )
}

export default registerComponent('ConversationItem', ConversationItem, {styles});



