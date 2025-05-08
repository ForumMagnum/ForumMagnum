import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import { useCurrentUser } from '../common/withUser';

export const EmailHistoryPageInner = () => {
  const currentUser = useCurrentUser();
  if (!currentUser) return <div/>
  
  return <Components.EmailHistory
    terms={{view: "emailHistory", userId: currentUser._id}}
  />
}

export const EmailHistoryPage = registerComponent('EmailHistoryPage', EmailHistoryPageInner);


export const EmailHistoryInner = ({terms}: {terms: LWEventsViewTerms}) => {
  const { results } = useMulti({
    terms,
    collectionName: 'LWEvents',
    fragmentName: 'emailHistoryFragment',
    enableTotal: false
  });
  if (!results) return <Components.Loading/>
  
  return <>{results.map((lwEvent,i) =>
    <Components.EmailPreview key={lwEvent._id} email={lwEvent.properties} sentDate={lwEvent.createdAt ?? undefined}/>)
  }</>
}

export const EmailHistory = registerComponent('EmailHistory', EmailHistoryInner);

declare global {
  interface ComponentTypes {
    EmailHistoryPage: typeof EmailHistoryPage
    EmailHistory: typeof EmailHistory
  }
}
