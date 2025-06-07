import React from 'react';
import { useCurrentUser } from '../common/withUser';
import Loading from "../vulcan-core/Loading";
import EmailPreview from "../notifications/EmailPreview";
import { maybeDate } from '@/lib/utils/dateUtils';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/crud/wrapGql";

const emailHistoryFragmentMultiQuery = gql(`
  query multiLWEventEmailHistoryQuery($selector: LWEventSelector, $limit: Int, $enableTotal: Boolean) {
    lWEvents(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...emailHistoryFragment
      }
      totalCount
    }
  }
`);

export const EmailHistoryPage = () => {
  const currentUser = useCurrentUser();
  if (!currentUser) return <div/>
  
  return <EmailHistory
    terms={{view: "emailHistory", userId: currentUser._id}}
  />
}


export const EmailHistory = ({terms}: {terms: LWEventsViewTerms}) => {
  const { view, limit, ...selectorTerms } = terms;
  const { data } = useQuery(emailHistoryFragmentMultiQuery, {
    variables: {
      selector: { [view]: selectorTerms },
      limit: limit ?? 10,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
  });

  const results = data?.lWEvents?.results;
  if (!results) return <Loading/>
  
  return <>{results.map((lwEvent,i) =>
    <EmailPreview key={lwEvent._id} email={lwEvent.properties} sentDate={maybeDate(lwEvent.createdAt) ?? undefined}/>)
  }</>
}
