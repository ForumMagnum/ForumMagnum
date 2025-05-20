import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { useCurrentUser } from '../common/withUser';
import Loading from "../vulcan-core/Loading";
import EmailPreview from "../notifications/EmailPreview";
import { maybeDate } from '@/lib/utils/dateUtils';

export const EmailHistoryPage = () => {
  const currentUser = useCurrentUser();
  if (!currentUser) return <div/>
  
  return <EmailHistory
    terms={{view: "emailHistory", userId: currentUser._id}}
  />
}


export const EmailHistory = ({terms}: {terms: LWEventsViewTerms}) => {
  const { results } = useMulti({
    terms,
    collectionName: 'LWEvents',
    fragmentName: 'emailHistoryFragment',
    enableTotal: false
  });
  if (!results) return <Loading/>
  
  return <>{results.map((lwEvent,i) =>
    <EmailPreview key={lwEvent._id} email={lwEvent.properties} sentDate={maybeDate(lwEvent.createdAt) ?? undefined}/>)
  }</>
}
