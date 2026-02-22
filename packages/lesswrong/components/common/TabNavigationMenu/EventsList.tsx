import { useUserLocation } from '@/components/hooks/useUserLocation';
import React from 'react';
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import TabNavigationEventsList from "../../localGroups/TabNavigationEventsList";
import { SuspenseWrapper } from '../SuspenseWrapper';
import { useCurrentUser } from '../withUser';

export const EventsList = ({onClick}: {
  onClick: (e?: React.BaseSyntheticEvent) => void
}) => {
  const currentUser = useCurrentUser();
  const {lat, lng, known} = useUserLocation(currentUser, true)
  
  if (lat && lng && known) {
    const nearbyTerms: PostsViewTerms = {
      view: 'nearbyEvents',
      lat: lat,
      lng: lng,
      limit: 4,
    }
    return <span>
      <AnalyticsContext pageSubSectionContext="menuEventsList">
        <SuspenseWrapper name="TabNavigationEventsList">
          <TabNavigationEventsList onClick={onClick} terms={nearbyTerms} />
        </SuspenseWrapper>
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
      <SuspenseWrapper name="TabNavigationEventsList">
        <TabNavigationEventsList onClick={onClick} terms={globalTerms} />
        {<TabNavigationEventsList onClick={onClick} terms={eventsListTerms} />}
      </SuspenseWrapper>
    </AnalyticsContext>
  </span>
}

export default EventsList;


