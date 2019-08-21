import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';

const EventsUpcoming = () => {
  const { SingleColumnSection, SectionTitle, PostsList2 } = Components
  const terms = { view: 'upcomingEvents', limit: 20 }

  return (
    <SingleColumnSection>
      <SectionTitle title="Upcoming Events"/>
      <PostsList2 terms={terms}/>
    </SingleColumnSection>
  )
}

registerComponent('EventsUpcoming', EventsUpcoming);
