import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib/components';
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { forumTypeSetting } from '../../../lib/instanceSettings';
import { useUserLocation } from '../../../lib/collections/users/helpers';

const isEAForum = forumTypeSetting.get() === 'EAForum'

const EventsList = ({currentUser, onClick}) => {
  const { TabNavigationEventsList } = Components
  
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
        <TabNavigationEventsList onClick={onClick} terms={nearbyTerms} />
      </AnalyticsContext>
    </span>
  }

  const eventsListTerms: PostsViewTerms = {
    view: 'events',
    globalEvent: false,
    limit: isEAForum ? 1 : 2,
  }
  const globalTerms: PostsViewTerms = {
    view: 'globalEvents',
    limit: isEAForum ? 3 : 2,
  }
  return <span>
    <AnalyticsContext pageSubSectionContext="menuEventsList">
      <TabNavigationEventsList onClick={onClick} terms={globalTerms} />
      <TabNavigationEventsList onClick={onClick} terms={eventsListTerms} />
    </AnalyticsContext>
  </span>
}

const EventsListComponent = registerComponent("EventsList", EventsList);

declare global {
  interface ComponentTypes {
    EventsList: typeof EventsListComponent
  }
}
