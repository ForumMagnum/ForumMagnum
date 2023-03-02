import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';

const EventsUpcoming = () => {
  const { SingleColumnSection, SectionTitle, PostsList2 } = Components
  const terms = { view: 'upcomingEvents', limit: 20 }

  return (
    <SingleColumnSection>
      <SectionTitle title="Upcoming events"/>
      <PostsList2 terms={terms}/>
    </SingleColumnSection>
  )
}

const EventsUpcomingComponent = registerComponent('EventsUpcoming', EventsUpcoming);

declare global {
  interface ComponentTypes {
    EventsUpcoming: typeof EventsUpcomingComponent
  }
}

