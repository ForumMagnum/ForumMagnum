import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import * as _ from 'underscore';
import CalendarDate from "../common/CalendarDate";
import Loading from "../vulcan-core/Loading";
import { MenuItem } from "../common/Menus";
import { maybeDate } from '@/lib/utils/dateUtils';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";

const lastEventFragmentMultiQuery = gql(`
  query multiLWEventLastVisitListQuery($selector: LWEventSelector, $limit: Int, $enableTotal: Boolean) {
    lWEvents(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...lastEventFragment
      }
      totalCount
    }
  }
`);

const VISITS_TO_SHOW = 4
const MINIMUM_TIME_BETWEEN = 120000; //in milliseconds

const LastVisitList = ({ postId, currentUser, clickCallback }: {
  postId: string,
  currentUser: UsersCurrent,
  clickCallback: (date: Date) => void,
}) => {
  const { data, loading } = useQuery(lastEventFragmentMultiQuery, {
    variables: {
      selector: { postVisits: { postId: postId, userId: currentUser._id } },
      limit: 20,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
  });

  const results = data?.lWEvents?.results;
  
  if (loading || !results)
    return <Loading/>
  
  // We load more visits than we're going to display, then filter out duplicates and
  // near-duplicates. "Duplicates" in this case means two visits within 2 minutes of
  // each other; that could be caused by bugs where the posts page double-counts
  // post views (we have some of those), or by opening the same post twice with a
  // double middle click, etc.
  let filteredVisits: lastEventFragment[] = [];
  for (let visit of results) {
    if (filteredVisits.length) {
      const prevVisit = filteredVisits[filteredVisits.length-1];
      const timeSince = new Date(prevVisit.createdAt!).getTime() - new Date(visit.createdAt!).getTime(); //in milliseconds
      if (timeSince > MINIMUM_TIME_BETWEEN) {
        filteredVisits.push(visit);
      }
    } else {
      filteredVisits.push(visit);
    }
  }
  
  if (filteredVisits.length>VISITS_TO_SHOW)
    filteredVisits = _.take(filteredVisits, VISITS_TO_SHOW);
  
  return <>{filteredVisits.map((visit) =>
    <MenuItem key={visit._id} dense onClick={() => clickCallback(maybeDate(visit.createdAt)!)}>Visit at:&nbsp;<CalendarDate date={visit.createdAt!}/> </MenuItem>
  )}</>
}

export default registerComponent("LastVisitList", LastVisitList);



