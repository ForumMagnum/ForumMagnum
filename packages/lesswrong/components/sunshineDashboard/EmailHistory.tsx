import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import { useCurrentUser } from '../common/withUser';
import { Loading } from "../vulcan-core/Loading";
import { EmailPreview } from "../notifications/EmailPreview";

export const EmailHistoryPageInner = () => {
  const currentUser = useCurrentUser();
  if (!currentUser) return <div/>
  
  return <EmailHistory
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
  if (!results) return <Loading/>
  
  return <>{results.map((lwEvent,i) =>
    <EmailPreview key={lwEvent._id} email={lwEvent.properties} sentDate={lwEvent.createdAt ?? undefined}/>)
  }</>
}

export const EmailHistory = registerComponent('EmailHistory', EmailHistoryInner);


