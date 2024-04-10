import React, {useState} from 'react';
import { fragmentTextForQuery, registerComponent } from '../../lib/vulcan-lib';
import {useOnServerSentEvent} from '../hooks/useUnreadNotifications';
import {useCurrentUser} from '../common/withUser';
import {useGlobalKeydown} from '../common/withGlobalKeydown';
import {gql, useMutation} from '@apollo/client';
import throttle from 'lodash/throttle';
import { isDialogueParticipant } from '../posts/PostsPage/PostsPage';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...theme.typography.commentStyle
  },
});

const INCIDATOR_UPDATE_PERIOD = 15000
const INDICATOR_DISPLAY_PERIOD = 20000;

export const DebateTypingIndicator = ({classes, post}: {
  classes: ClassesType,
  post: PostsWithNavigation | PostsWithNavigationAndRevision,
}) => {

  const [typingIndicators, setTypingIndicators] = useState<TypingIndicatorInfo[]>([]);
  const currentUser = useCurrentUser();

  const [upsertTypingIndicator] = useMutation(gql`
    mutation upsertUserTypingIndicator($documentId: String!) {
      upsertUserTypingIndicator(documentId: $documentId) {
        ...TypingIndicatorsDefaultFragment
      }
    }
    ${fragmentTextForQuery("TypingIndicatorsDefaultFragment")}
  `)

  useGlobalKeydown(throttle(() => {
    // Note, ideally we'd have a more specific trigger for the typing indicator
    // rather than "literally any keypress", but that was a bit more complicated
    // and this is a good enough approximation for now.

    // If we continue to use this in more places or update it, we may want to 
    // make it more specific 
    if (currentUser && isDialogueParticipant(currentUser._id, post)) {
      void upsertTypingIndicator({variables: {documentId: post._id}})
    }
  }, INCIDATOR_UPDATE_PERIOD));

  useOnServerSentEvent('typingIndicator', currentUser, (message) => {
    const typingIndicators = message.typingIndicators
    const filteredIndicators = typingIndicators.filter((typingIndicator) => {
      return typingIndicator.documentId === post._id
    })
    setTypingIndicators(filteredIndicators)
  });

  if (!currentUser) return null;

  const otherUsers = typingIndicators.filter((typingIndicator) => {
    const twentySecondsAgo = Date.now() - INDICATOR_DISPLAY_PERIOD;
    const typingIndicatorIsRecent = (new Date(typingIndicator.lastUpdated).getTime()) > twentySecondsAgo;
    const typingIndicatorIsNotCurrentUser = typingIndicator.userId !== currentUser._id
    return typingIndicatorIsRecent && typingIndicatorIsNotCurrentUser
  })

  return <div className={classes.root}>
    {otherUsers.length > 0 && <div>
        {otherUsers.length} {otherUsers.length === 1 ? 
          'user is' : 
          'users are'} typing...
      </div>
    }
  </div>;
}

const DebateTypingIndicatorComponent = registerComponent('DebateTypingIndicator', DebateTypingIndicator, {styles});

declare global {
  interface ComponentTypes {
    DebateTypingIndicator: typeof DebateTypingIndicatorComponent
  }
}
