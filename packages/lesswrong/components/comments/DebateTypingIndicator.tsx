import React, {useState} from 'react';
import { fragmentTextForQuery, registerComponent } from '../../lib/vulcan-lib';
import {useOnNotificationsChanged} from '../hooks/useUnreadNotifications';
import {useCurrentUser} from '../common/withUser';
import {useGlobalKeydown} from '../common/withGlobalKeydown';
import {gql, useMutation} from '@apollo/client';
import throttle from 'lodash/throttle';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...theme.typography.commentStyle
  },
});

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
    void upsertTypingIndicator({variables: {documentId: post._id}})
  }, 300));

  useOnNotificationsChanged(currentUser, (message) => {
    if (message.eventType === 'typingIndicator') {
      const typingIndicators = message.typingIndicators
      const filteredIndicators = typingIndicators.filter((typingIndicator) => {
        return typingIndicator.documentId === post._id
      })
      setTypingIndicators(filteredIndicators)
    }
  });

  if (!currentUser) return null;

  const otherUsers = typingIndicators.filter((typingIndicator) => {
    const twentySecondsAgo = Date.now() - 20000
    const typingIndicatorIsRecent = (new Date(typingIndicator.lastUpdated ?? 0).getTime()) > twentySecondsAgo;
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
