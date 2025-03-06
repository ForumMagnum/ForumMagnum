import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import * as _ from 'underscore';
import { Loading } from "@/components/vulcan-core/Loading";
import { MenuItem } from "@/components/common/Menus";
import CalendarDate from "@/components/common/CalendarDate";

const VISITS_TO_SHOW = 4
const MINIMUM_TIME_BETWEEN = 120000; //in milliseconds

const LastVisitList = ({ postId, currentUser, clickCallback }: {
  postId: string,
  currentUser: UsersCurrent,
  clickCallback: (date: Date) => void,
}) => {
  const { results, loading } = useMulti({
    terms: {
      view: "postVisits",
      limit: 20,
      postId: postId,
      userId: currentUser._id
    },
    collectionName: "LWEvents",
    fragmentName: 'lastEventFragment',
    enableTotal: false,
  });
  
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
      const timeSince = new Date(prevVisit.createdAt).getTime() - new Date(visit.createdAt).getTime(); //in milliseconds
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
    <MenuItem key={visit._id} dense onClick={() => clickCallback(visit.createdAt)}>Visit at:&nbsp;<CalendarDate date={visit.createdAt}/> </MenuItem>
  )}</>
}

const LastVisitListComponent = registerComponent("LastVisitList", LastVisitList);

declare global {
  interface ComponentTypes {
    LastVisitList: typeof LastVisitListComponent,
  }
}

export default LastVisitListComponent;

