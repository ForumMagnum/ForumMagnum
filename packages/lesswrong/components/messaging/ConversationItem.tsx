import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import Conversations from '../../lib/collections/conversations/collection';
import { Link } from '../../lib/reactRouterWrapper';
import { postsItemLikeStyles } from '../localGroups/LocalGroupsItem'
import ArchiveIcon from '@material-ui/icons/Archive';
import UnarchiveIcon from '@material-ui/icons/Unarchive';
import Tooltip from '@material-ui/core/Tooltip';
import classNames from 'classnames'
import * as _ from 'underscore';

const styles = theme => ({
  ...postsItemLikeStyles(theme),
  leftMargin: {
    marginLeft: theme.spacing.unit * 2
  },
  archivedItem: {
    opacity: 0.5
  },
  commentFont: {
    ...theme.typography.commentStyle
  }
});

const ConversationItem = ({conversation, updateConversation, currentUser, classes}: {
  conversation: conversationsListFragment,
  updateConversation: any,
  currentUser: UsersCurrent,
  classes: ClassesType,
}) => {
  const { PostsItem2MetaInfo, UsersName, FormatDate } = Components
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
    <div className={classNames(classes.root, {[classes.archivedItem]: isArchived})}>
      <Link to={`/inbox/${conversation._id}`} className={classNames(classes.title, classes.commentFont)}>{Conversations.getTitle(conversation, currentUser)}</Link>
      { conversation.participants
        .filter(user => user._id !== currentUser._id)
        .map(user => <span key={user._id} className={classes.leftMargin}>
          <PostsItem2MetaInfo> <UsersName user={user} /> </PostsItem2MetaInfo>
        </span>)
      }
      {conversation.latestActivity && <span className={classes.leftMargin}><PostsItem2MetaInfo>
        <FormatDate date={conversation.latestActivity} />
      </PostsItem2MetaInfo></span>}
      {<div className={classes.actions} onClick={archiveIconClick}>
        <Tooltip title={isArchived ? "Restore this conversation" : "Archive this conversation"}>
          {isArchived ? <UnarchiveIcon /> : <ArchiveIcon />}
        </Tooltip>
      </div>}
    </div>
  )
}

const ConversationItemComponent = registerComponent('ConversationItem', ConversationItem, {styles});

declare global {
  interface ComponentTypes {
    ConversationItem: typeof ConversationItemComponent
  }
}

