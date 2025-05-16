import React, {useState} from 'react';
import {useOnServerSentEvent} from '../hooks/useUnreadNotifications';
import {useCurrentUser} from '../common/withUser';
import {useGlobalKeydown} from '../common/withGlobalKeydown';
import {gql, useMutation} from '@apollo/client';
import throttle from 'lodash/throttle';
import { isDialogueParticipant } from '@/lib/collections/posts/helpers';
import { print as gqlPrint } from 'graphql';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { TypingIndicatorInfo } from '@/lib/collections/typingIndicators/fragments';
import { PostsWithNavigation, PostsWithNavigationAndRevision, TypingIndicatorInfo as TypingIndicatorInfoType } from '@/lib/generated/gql-codegen/graphql';

const styles = (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle
  },
});

const INCIDATOR_UPDATE_PERIOD = 15000
const INDICATOR_DISPLAY_PERIOD = 20000;

export const DebateTypingIndicator = ({classes, post}: {
  classes: ClassesType<typeof styles>,
  post: PostsWithNavigation | PostsWithNavigationAndRevision,
}) => {

  const [typingIndicators, setTypingIndicators] = useState<TypingIndicatorInfoType[]>([]);
  const currentUser = useCurrentUser();

  const [upsertTypingIndicator] = useMutation(gql(`
    mutation upsertUserTypingIndicator($documentId: String!) {
      upsertUserTypingIndicator(documentId: $documentId) {
        ...TypingIndicatorInfo
      }
    }
    ${gqlPrint(TypingIndicatorInfo)}
  `))

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

export default registerComponent('DebateTypingIndicator', DebateTypingIndicator, {styles});


