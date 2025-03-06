import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import { useCurrentUser } from '../common/withUser';
import EmailPreview from "@/components/notifications/EmailPreview";
import { Loading } from "@/components/vulcan-core/Loading";

export const EmailHistoryPage = () => {
  const currentUser = useCurrentUser();
  if (!currentUser) return <div/>
  
  return <EmailHistory
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
  if (!results) return <Loading/>
  
  return <>{results.map((lwEvent,i) =>
    <EmailPreview key={lwEvent._id} email={lwEvent.properties} sentDate={lwEvent.createdAt}/>)
  }</>
}

const EmailHistoryComponent = registerComponent('EmailHistory', EmailHistory);

declare global {
  interface ComponentTypes {
    EmailHistoryPage: typeof EmailHistoryPageComponent
    EmailHistory: typeof EmailHistoryComponent
  }
}

export {
  EmailHistoryPageComponent as EmailHistoryPage,
  EmailHistoryComponent as EmailHistory
}
