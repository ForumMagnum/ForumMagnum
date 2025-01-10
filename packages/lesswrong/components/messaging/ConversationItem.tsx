import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { conversationGetTitle } from '../../lib/collections/conversations/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { postsItemLikeStyles } from '../localGroups/LocalGroupsItem'
import ArchiveIcon from '@material-ui/icons/Archive';
import UnarchiveIcon from '@material-ui/icons/Unarchive';
import Tooltip from '@material-ui/core/Tooltip';
import classNames from 'classnames'
import * as _ from 'underscore';

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
  }
});

const ConversationItem = ({conversation, updateConversation, currentUser, classes, expanded}: {
  conversation: ConversationsList,
  updateConversation: any,
  currentUser: UsersCurrent,
  classes: ClassesType<typeof styles>,
  expanded?: boolean
}) => {
  const { PostsItem2MetaInfo, UsersName, FormatDate, ConversationPreview } = Components
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
      {expanded && <div className={classes.expanded}>
        <ConversationPreview count={3} key={conversation._id} conversationId={conversation._id} currentUser={currentUser} showTitle={false} />
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

