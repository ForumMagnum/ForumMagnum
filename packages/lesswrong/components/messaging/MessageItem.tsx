import React, { useRef } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames';
import withErrorBoundary from '../common/withErrorBoundary';
import { useCurrentUser } from '../common/withUser';
import ProfilePhoto, { PROFILE_IMG_DIAMETER, PROFILE_IMG_DIAMETER_MOBILE } from './ProfilePhoto';
import { isFriendlyUI } from '../../themes/forumTheme';
import { Typography } from "../common/Typography";
import UsersName from "../users/UsersName";
import MetaInfo from "../common/MetaInfo";
import FormatDate from "../common/FormatDate";
import { ContentItemBody } from "../contents/ContentItemBody";
import { getVotingSystemByName } from "../../lib/voting/getVotingSystem";
import { useVote } from "../votes/withVote";
import InlineReactSelectionWrapper from "../votes/lwReactions/InlineReactSelectionWrapper";
import type { ContentItemBodyImperative, ContentReplacedSubstringComponentInfo } from "../contents/contentBodyUtil";
import { messageBottomComponents } from '@/lib/voting/votingSystemComponents';
import HoveredReactionContextProvider from '../votes/lwReactions/HoveredReactionContextProvider';
import { useHover } from '../common/withHover';
import type { MessageVotingBottomComponent } from '@/lib/voting/votingSystemTypes';

const styles = (theme: ThemeType) => ({
  hoverWrapper: {
    width: '100%',
  },
  root: {
    marginBottom:theme.spacing.unit*1.5,
  },
  rootWithImages: {
    maxWidth: '95%',
    display: 'grid',
    columnGap: 10,
    gridTemplateColumns: `${PROFILE_IMG_DIAMETER}px minmax(100px, 100%)`,
    gridTemplateAreas: '"image message"',
    [theme.breakpoints.down('xs')]: {
      gridTemplateColumns: `${PROFILE_IMG_DIAMETER_MOBILE}px minmax(100px, 100%)`,
    }
  },
  rootWithoutImages: {
    maxWidth: '80%',
    width: 'fit-content',
  },
  rootCurrentUser: {
    columnGap: 0,
    marginLeft: 'auto',
  },
  messageWrapper: {
    position: 'relative',
    gridArea: 'message',
  },
  message: {
    backgroundColor: theme.palette.grey[200],
    paddingTop: theme.spacing.unit,
    paddingBottom: theme.spacing.unit,
    paddingLeft: theme.spacing.unit*1.5,
    paddingRight: theme.spacing.unit*1.5,
    borderRadius:5,
    wordWrap: "break-word",
    overflowWrap: "break-word",
    whiteSpace: "normal",
    flexGrow: 1,
  },
  backgroundIsCurrent: {
    backgroundColor: theme.palette.grey[700],
    color: theme.palette.panelBackground.default,
    marginLeft:theme.spacing.unit*1.5,
  },
  meta: {
    marginBottom:theme.spacing.unit * (theme.isFriendlyUI ? 1.5 : 0.5),
  },
  whiteMeta: {
    color: theme.palette.text.invertedBackgroundText2,
  },
  messageBody: {
    '& a': {
      color: theme.palette.primary.light,
      wordWrap: "break-word",
      overflowWrap: "break-word",
      whiteSpace: "normal",
    },
    '& img': {
      maxWidth: '100%',
    },
    // Workaround to make sure links don't overflow the message box
    '& .LWTooltip-root': {
      display: 'inline',
    },
  },
  profileImg: {
    gridArea: 'image',
    alignSelf: 'flex-end'
  },
  username: {
    marginRight: 6,
    fontWeight: 600
  },
  bottom: {
    display: 'flex',
    justifyContent: 'flex-end',
  }
})

/**
 * Display of a single message in the Conversation Wrapper
*/
const MessageItem = ({message, classes}: {
  message: messageListFragment,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const { html = "" } = message?.contents || {}

  
  const isCurrentUser = (currentUser && message.user) && currentUser._id === message.user._id

  const votingSystem = getVotingSystemByName("namesAttachedReactions");
  const voteProps = useVote(message, "Messages", votingSystem);
  const messageBodyRef = useRef<ContentItemBodyImperative|null>(null);
  const { hover, eventHandlers } = useHover();

  if (!message) return null;
  if (!html) return null

  const colorClassName = classNames({[classes.whiteMeta]: isCurrentUser})

  let profilePhoto: React.ReactNode|null = null;
  if (!isCurrentUser && isFriendlyUI()) {
    profilePhoto = <ProfilePhoto user={message.user} className={classes.profileImg} />
  }

  let highlights: ContentReplacedSubstringComponentInfo[]|undefined = undefined;
  if (voteProps && votingSystem?.getMessageHighlights) {
    highlights = votingSystem.getMessageHighlights({message, voteProps});
  }

  const VoteBottomComponent: MessageVotingBottomComponent | null = messageBottomComponents[votingSystem.name]?.() ?? null;

  const bodyElement = <ContentItemBody
    ref={messageBodyRef}
    dangerouslySetInnerHTML={{__html: html}}
    className={classes.messageBody}
    description={`message ${message._id}`}
    replacedSubstrings={highlights}
    invertSubstitutionColors={!!isCurrentUser}
  />;
  
  return (
    <span className={classes.hoverWrapper} {...eventHandlers}>
    <div className={classNames(
      classes.root,
      isFriendlyUI() ? classes.rootWithImages : classes.rootWithoutImages,
      isCurrentUser && classes.rootCurrentUser
    )}>
      {profilePhoto}
      <HoveredReactionContextProvider voteProps={voteProps}>
        <div className={classes.messageWrapper}>
          <Typography variant="body2" className={classNames(classes.message, {[classes.backgroundIsCurrent]: isCurrentUser})}>
            <div className={classes.meta}>
              {message.user && <span className={classes.username}>
                <span className={colorClassName}><UsersName user={message.user}/></span>
              </span>}
              <span>{" " /* Explicit space (rather than just padding/margin) for copy-paste purposes */}</span>
              {message.createdAt && <MetaInfo>
                <span className={colorClassName}><FormatDate date={message.createdAt}/></span>
              </MetaInfo>}
            </div>

            {votingSystem.hasInlineReacts ? <InlineReactSelectionWrapper contentRef={messageBodyRef} voteProps={voteProps} styling="comment">
                {bodyElement}
              </InlineReactSelectionWrapper>
            : bodyElement}
          </Typography>
          
          {VoteBottomComponent && (
            <VoteBottomComponent
              voteProps={voteProps}
              invertColors={!!isCurrentUser}
              isCurrentUser={!!isCurrentUser}
              isHovered={hover}
            />
          )}
        </div>
      </HoveredReactionContextProvider>
    </div>
    </span>
  )
}


export default registerComponent('MessageItem', MessageItem, {
  styles, hocs: [withErrorBoundary]
});



