import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { preferredHeadingCase } from '../../themes/forumTheme';

const EventsUpcomingInner = () => {
  const { SingleColumnSection, SectionTitle, PostsList2 } = Components
  const terms = { view: 'upcomingEvents', limit: 20 } as const;

  return (
    <SingleColumnSection>
      <SectionTitle title={preferredHeadingCase("Upcoming Events")} />
      <PostsList2 terms={terms}/>
    </SingleColumnSection>
  )
}

export const EventsUpcoming = registerComponent('EventsUpcoming', EventsUpcomingInner);

declare global {
  interface ComponentTypes {
    EventsUpcoming: typeof EventsUpcoming
  }
}
