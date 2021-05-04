import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib/components';
import { AnalyticsContext } from "../../../lib/analyticsEvents";

const EventsList = ({currentUser, onClick}) => {
  const { TabNavigationEventsList } = Components

  const lat = currentUser &&
    currentUser.mongoLocation &&
    currentUser.mongoLocation.coordinates[1]
  const lng = currentUser &&
    currentUser.mongoLocation &&
    currentUser.mongoLocation.coordinates[0]
  let eventsListTerms: PostsViewTerms = {
    view: 'events',
    onlineEvent: false,
    limit: 3,
  }
  if (lat && lng) {
    eventsListTerms = {
      onlineEvent: false,
      view: 'nearbyEvents',
      lat: lat,
      lng: lng,
      limit: 1,
    }
  }
  const onlineTerms: PostsViewTerms = {
    view: 'onlineEvents',
    limit: 4
  }
  return <span>
    <AnalyticsContext pageSubSectionContext="menuEventsList">
      <TabNavigationEventsList onClick={onClick} terms={onlineTerms} />
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
