// TODO: Import component in components.ts
import React, {useEffect, useRef, useState} from 'react';
import { fragmentTextForQuery, registerComponent } from '../../lib/vulcan-lib';
import {useOnNotificationsChanged} from '../hooks/useUnreadNotifications';
import {useCurrentUser} from '../common/withUser';
import {TypingIndicatorMessage} from '../../client/serverSentEventsClient';
import {useGlobalKeydown} from '../common/withGlobalKeydown';
import {useMulti} from '../../lib/crud/withMulti';
import {gql, useMutation} from '@apollo/client';

const styles = (theme: ThemeType): JssStyles => ({
  root: {

  }
});

export const DebateTypingIndicator = ({classes, post}: {
  classes: ClassesType,
  post: PostsWithNavigation | PostsWithNavigationAndRevision,
}) => {


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

  const [keyPressCounter, setKeyPressCounter] = React.useState(0);


  useGlobalKeydown((event) => {
    
    const newKeyPressCounter = keyPressCounter + 1;
  
    if (!currentUser) {
      setKeyPressCounter(0);
      return;
    }
  
    if (newKeyPressCounter >= 0) {
      void upsertTypingIndicator({variables: {documentId: post._id}})
      setKeyPressCounter(0);
    } else {
      setKeyPressCounter(newKeyPressCounter);
    }
  });

  useOnNotificationsChanged(currentUser, (messageString) => {
    const message : TypingIndicatorMessage = JSON.parse(messageString)
    const typingIndicators = message.typingIndicators ?? []
    const filteredIndicators = typingIndicators.filter((typingIndicator) => {
      return typingIndicator.documentId === post._id
    })
    setTypingIndicators(filteredIndicators)
  });

  return <div className={classes.root}>
    {/* {typingIndicators.length > 0 && <div>
      {typingIndicators.length} {typingIndicators.length === 1 ? 
        'user is' : 
        'users are'} typing...
      </div>} */}
      {typingIndicators.map((typingIndicator, index) => {
        return <div key={typingIndicator._id}>
          {typingIndicator.userId} last typed {new Date(typingIndicator.lastUpdated).toLocaleTimeString()}
        </div>
      })
    }
  </div>;
}

const DebateTypingIndicatorComponent = registerComponent('DebateTypingIndicator', DebateTypingIndicator, {styles});

declare global {
  interface ComponentTypes {
    DebateTypingIndicator: typeof DebateTypingIndicatorComponent
  }
}
