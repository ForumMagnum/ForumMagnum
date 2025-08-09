import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { useUserLocation } from '@/components/hooks/useUserLocation';
import { isEAForum } from '../../../lib/instanceSettings';
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
      limit: isEAForum ? 2 : 4,
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
        {!isEAForum && <TabNavigationEventsList onClick={onClick} terms={eventsListTerms} />}
      </SuspenseWrapper>
    </AnalyticsContext>
  </span>
}

export default registerComponent("EventsList", EventsList);


