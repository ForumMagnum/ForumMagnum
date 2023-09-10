import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import classNames from 'classnames';
import withErrorBoundary from '../common/withErrorBoundary';
import { useCurrentUser } from '../common/withUser';
import { PROFILE_IMG_DIAMETER, PROFILE_IMG_DIAMETER_MOBILE } from './ProfilePhoto';
import { isFriendlyUI } from '../../themes/forumTheme';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginBottom:theme.spacing.unit*1.5,
  },
  rootWithImages: {
    display: 'grid',
    columnGap: 10,
    maxWidth: '95%',
    gridTemplateColumns: `${PROFILE_IMG_DIAMETER}px 1fr`,
    gridTemplateAreas: '"image message"',
    [theme.breakpoints.down('xs')]: {
      gridTemplateColumns: `${PROFILE_IMG_DIAMETER_MOBILE}px 1fr`,
    }
  },
  rootCurrentUserWithImages: {
    columnGap: 0,
    marginLeft: 'auto',
  },
  message: {
    backgroundColor: theme.palette.grey[200],
    paddingTop: theme.spacing.unit,
    paddingBottom: theme.spacing.unit,
    paddingLeft: theme.spacing.unit*1.5,
    paddingRight: theme.spacing.unit*1.5,
    borderRadius:5,
    wordWrap: "break-word",
    flexGrow: 1,
    gridArea: 'message',
  },
  backgroundIsCurrent: {
    backgroundColor: theme.palette.grey[700],
    color: theme.palette.panelBackground.default,
    marginLeft:theme.spacing.unit*1.5,
  },
  meta: {
    marginBottom:theme.spacing.unit*1.5,
  },
  whiteMeta: {
    color: theme.palette.text.invertedBackgroundText2,
  },
  messageBody: {
    '& a': {
      color: theme.palette.primary.light
    },
    '& img': {
      maxWidth: '100%',
    },
  },
  profileImg: {
    gridArea: 'image',
    alignSelf: 'flex-end'
  },
  username: {
    marginRight: 6,
    fontWeight: 600
  }
})

/**
 * Display of a single message in the Conversation Wrapper
*/
const MessageItem = ({message, classes}: {
  message: messageListFragment,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const { html = "" } = message?.contents || {}
  if (!message) return null;
  if (!html) return null
  
  const isCurrentUser = (currentUser && message.user) && currentUser._id === message.user._id
  const htmlBody = {__html: html};
  const colorClassName = classNames({[classes.whiteMeta]: isCurrentUser})

  let profilePhoto: React.ReactNode|null = null;
  if (!isCurrentUser && isFriendlyUI) {
    profilePhoto = <Components.ProfilePhoto user={message.user} className={classes.profileImg} />
  }
  
  return (
    <div className={classNames(classes.root, {[classes.rootWithImages]: isFriendlyUI, [classes.rootCurrentUserWithImages]: isFriendlyUI && isCurrentUser})}>
      {profilePhoto}
      <Components.Typography variant="body2" className={classNames(classes.message, {[classes.backgroundIsCurrent]: isCurrentUser})}>
        <div className={classes.meta}>
          {message.user && <span className={classes.username}>
            <span className={colorClassName}><Components.UsersName user={message.user}/></span>
          </span>}
          <span>{" " /* Explicit space (rather than just padding/margin) for copy-paste purposes */}</span>
          {message.createdAt && <Components.MetaInfo>
            <span className={colorClassName}><Components.FormatDate date={message.createdAt}/></span>
          </Components.MetaInfo>}
        </div>
        <Components.ContentItemBody
          dangerouslySetInnerHTML={htmlBody}
          className={classes.messageBody}
          description={`message ${message._id}`}
        />
      </Components.Typography>
    </div>
  )
}


const MessageItemComponent = registerComponent('MessageItem', MessageItem, {
  styles, hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    MessageItem: typeof MessageItemComponent
  }
}

