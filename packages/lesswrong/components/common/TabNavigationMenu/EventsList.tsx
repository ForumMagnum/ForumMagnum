import React, { Suspense } from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { useUserLocation } from '../../../lib/collections/users/helpers';
import { isEAForum } from '../../../lib/instanceSettings';
import TabNavigationEventsList from "../../localGroups/TabNavigationEventsList";

export const EventsList = ({currentUser, onClick}: {
  currentUser: UsersCurrent | null,
  onClick: (e?: React.BaseSyntheticEvent) => void
}) => {
  const {lat, lng, known} = useUserLocation(currentUser, true)
  
  if (lat && lng && known) {
    const nearbyTerms: PostsViewTerms = {
      view: 'nearbyEvents',
      lat: lat,
      lng: lng,
      limit: isEAForum ? 2 : 4,
    }
    return <span>
      <AnalyticsContext pageSubSectionContext="menuEventsList">
        <TabNavigationEventsList onClick={onClick} terms={nearbyTerms} />
      </AnalyticsContext>
    </span>
  }

  const eventsListTerms: PostsViewTerms = {
    view: 'events',
    globalEvent: false,
    limit: 2,
  }
  const globalTerms: PostsViewTerms = {
    view: 'globalEvents',
    limit: 2,
  }
  return <span>
    <AnalyticsContext pageSubSectionContext="menuEventsList">
      <Suspense>
        <TabNavigationEventsList onClick={onClick} terms={globalTerms} />
        {!isEAForum && <TabNavigationEventsList onClick={onClick} terms={eventsListTerms} />}
      </Suspense>
    </AnalyticsContext>
  </span>
}

export default registerComponent("EventsList", EventsList);


