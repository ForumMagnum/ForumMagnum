import React, { useState, useEffect } from 'react';
import * as _ from 'underscore';
import { registerComponent, Components } from '../../../lib/vulcan-lib/components';
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { userGetLocation } from '../../../lib/collections/users/helpers';

const EventsList = ({currentUser, onClick}) => {
  const [currentUserLocation, setCurrentUserLocation] = useState(userGetLocation(currentUser, null));
  
  useEffect(() => {
    userGetLocation(currentUser, (newLocation) => {
      if (!_.isEqual(currentUserLocation, newLocation)) {
        setCurrentUserLocation(newLocation);
      }
    });
  }, [currentUserLocation, currentUser]);
  
  const { TabNavigationEventsList } = Components

  let eventsListTerms: PostsViewTerms = {
    view: 'events',
    onlineEvent: false,
    limit: 3,
  }
  if (currentUserLocation.known) {
    eventsListTerms = {
      view: 'nearbyEvents',
      lat: currentUserLocation.lat,
      lng: currentUserLocation.lng,
      onlineEvent: false,
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
      {!currentUserLocation.loading && <TabNavigationEventsList onClick={onClick} terms={eventsListTerms} />}
    </AnalyticsContext>
  </span>
}

const EventsListComponent = registerComponent("EventsList", EventsList);

declare global {
  interface ComponentTypes {
    EventsList: typeof EventsListComponent
  }
}
