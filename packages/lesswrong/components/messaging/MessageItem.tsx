/*

Display of a single message in the Conversation Wrapper

*/

import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import classNames from 'classnames';
import withErrorBoundary from '../common/withErrorBoundary';
import { useCurrentUser } from '../common/withUser';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import { forumTypeSetting } from '../../lib/instanceSettings';

const PROFILE_IMG_WIDTH = 36
const PROFILE_IMG_WIDTH_MOBILE = 26

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginBottom:theme.spacing.unit*1.5,
  },
  rootWithImages: {
    display: 'grid',
    columnGap: 10,
    maxWidth: '95%',
    gridTemplateColumns: `${PROFILE_IMG_WIDTH}px 1fr`,
    gridTemplateAreas: '"image message"',
    [theme.breakpoints.down('xs')]: {
      gridTemplateColumns: `${PROFILE_IMG_WIDTH_MOBILE}px 1fr`,
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
    marginBottom:theme.spacing.unit*1.5
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
  profileImage: {
    'box-shadow': `3px 3px 1px ${theme.palette.boxShadowColor(.25)}`,
    '-webkit-box-shadow': `0px 0px 2px 0px ${theme.palette.boxShadowColor(.25)}`,
    '-moz-box-shadow': `3px 3px 1px ${theme.palette.boxShadowColor(.25)}`,
    borderRadius: '50%',
    gridArea: 'image',
    alignSelf: 'flex-end',
    [theme.breakpoints.down('xs')]: {
      height: PROFILE_IMG_WIDTH_MOBILE,
      width: PROFILE_IMG_WIDTH_MOBILE
    }
  },
  defaultProfileImage: {
    gridArea: 'image',
    alignSelf: 'flex-end',
    fontSize: PROFILE_IMG_WIDTH,
    color: theme.palette.grey[400],
    borderRadius: '50%',
    [theme.breakpoints.down('xs')]: {
      fontSize: PROFILE_IMG_WIDTH_MOBILE
    }
  },
})

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
  const isEAForum = forumTypeSetting.get() === 'EAForum'

  let profilePhoto
  if (!isCurrentUser && isEAForum) {
    profilePhoto = message.user?.profileImageId ? <Components.CloudinaryImage2
      imgProps={{q: '100', h: `${PROFILE_IMG_WIDTH}`, w: `${PROFILE_IMG_WIDTH}`}}
      publicId={message.user.profileImageId}
      className={classes.profileImage}
    /> : <AccountCircleIcon viewBox="3 3 18 18" className={classes.defaultProfileImage}/>
  }
  
  return (
    <div className={classNames(classes.root, {[classes.rootWithImages]: isEAForum, [classes.rootCurrentUserWithImages]: isEAForum && isCurrentUser})}>
      {profilePhoto}
      <Components.Typography variant="body2" className={classNames(classes.message, {[classes.backgroundIsCurrent]: isCurrentUser})}>
        <div className={classes.meta}>
          {message.user && <Components.MetaInfo>
            <span className={colorClassName}><Components.UsersName user={message.user}/></span>
          </Components.MetaInfo>}
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

