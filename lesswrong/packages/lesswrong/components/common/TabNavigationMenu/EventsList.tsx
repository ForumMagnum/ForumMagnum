import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib/components';
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { useUserLocation } from '../../../lib/collections/users/helpers';
import { isEAForum } from '../../../lib/instanceSettings';
import TabNavigationEventsList from "@/components/localGroups/TabNavigationEventsList";

const EventsList = ({currentUser, onClick}: {
  currentUser: UsersCurrent | null,
  onClick: () => void
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
      <TabNavigationEventsList onClick={onClick} terms={globalTerms} />
      {!isEAForum && <TabNavigationEventsList onClick={onClick} terms={eventsListTerms} />}
    </AnalyticsContext>
  </span>
}

const EventsListComponent = registerComponent("EventsList", EventsList);

declare global {
  interface ComponentTypes {
    EventsList: typeof EventsListComponent
  }
}

export default EventsListComponent;
