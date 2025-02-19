import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { useCurrentUser } from '../common/withUser';

export const EmailHistoryPage = () => {
  const currentUser = useCurrentUser();
  if (!currentUser) return <div/>
  
  return <Components.EmailHistory
    terms={{view: "emailHistory", userId: currentUser._id}}
  />
}

const EmailHistoryPageComponent = registerComponent('EmailHistoryPage', EmailHistoryPage);


export const EmailHistory = ({terms}: {terms: LWEventsViewTerms}) => {
  const { results } = useMulti({
    terms,
    collectionName: 'LWEvents',
    fragmentName: 'emailHistoryFragment',
    enableTotal: false
  });
  if (!results) return <Components.Loading/>
  
  return <>{results.map((lwEvent,i) =>
    <Components.EmailPreview key={lwEvent._id} email={lwEvent.properties} sentDate={lwEvent.createdAt}/>)
  }</>
}

const EmailHistoryComponent = registerComponent('EmailHistory', EmailHistory);

declare global {
  interface ComponentTypes {
    EmailHistoryPage: typeof EmailHistoryPageComponent
    EmailHistory: typeof EmailHistoryComponent
  }
}
