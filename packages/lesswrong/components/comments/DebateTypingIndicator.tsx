// TODO: Import component in components.ts
import React, {useEffect, useRef, useState} from 'react';
import { Components, fragmentTextForQuery, registerComponent } from '../../lib/vulcan-lib';
import {useOnNotificationsChanged} from '../hooks/useUnreadNotifications';
import {useCurrentUser} from '../common/withUser';
import {TypingIndicatorMessage} from '../../client/serverSentEventsClient';
import {useGlobalKeydown} from '../common/withGlobalKeydown';
import {useMulti} from '../../lib/crud/withMulti';
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
  const { LWTooltip, FormatDate } = Components

  const { results } = useMulti({
    terms: {view: "typingIndicatorsForPost", documentId: post._id},
    collectionName: "TypingIndicators",
    fragmentName: 'TypingIndicatorInfo',
  });

  //console.log( "results", results )

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

  useOnNotificationsChanged(currentUser, (messageString) => {
    const message : TypingIndicatorMessage = JSON.parse(messageString)
    const typingIndicators = message.typingIndicators ?? []
    const filteredIndicators = typingIndicators.filter((typingIndicator) => {
      return typingIndicator.documentId === post._id
    })
    setTypingIndicators(filteredIndicators)
  });

  if (!currentUser) return null;

  const otherUsers = typingIndicators.filter((typingIndicator) => {
    const fiveSecondsAgo = Date.now() - 5000
    const typingIndicatorIsRecent = (new Date(typingIndicator.lastUpdated ?? 0).getTime()) > fiveSecondsAgo;
    console.log("typing indicator", typingIndicatorIsRecent, "type of typingIndicatorIsRecent", typeof typingIndicatorIsRecent, typingIndicator.lastUpdated, fiveSecondsAgo)
    const typingIndicatorIsNotCurrentUser = typingIndicator.userId !== currentUser._id
    return typingIndicatorIsRecent && typingIndicatorIsNotCurrentUser
  })

  const tooltip = <div>
    {typingIndicators.map((typingIndicator) => <div key={typingIndicator._id}>
      {typingIndicator.userId.slice(0,5)} last typed <FormatDate date={typingIndicator.lastUpdated} /> ago
    </div>)}
  </div>

  return <div className={classes.root}>
    {otherUsers.length > 0 && <LWTooltip title={tooltip}>
      <div>
        {otherUsers.length} {otherUsers.length === 1 ? 
          'user is' : 
          'users are'} typing...
      </div>
    </LWTooltip>}
  </div>;
}

const DebateTypingIndicatorComponent = registerComponent('DebateTypingIndicator', DebateTypingIndicator, {styles});

declare global {
  interface ComponentTypes {
    DebateTypingIndicator: typeof DebateTypingIndicatorComponent
  }
}
