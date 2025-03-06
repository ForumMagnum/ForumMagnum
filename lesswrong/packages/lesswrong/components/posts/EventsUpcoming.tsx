import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { preferredHeadingCase } from '../../themes/forumTheme';
import SingleColumnSection from "@/components/common/SingleColumnSection";
import { SectionTitle } from "@/components/common/SectionTitle";
import PostsList2 from "@/components/posts/PostsList2";

const EventsUpcoming = () => {
  const terms = { view: 'upcomingEvents', limit: 20 } as const;

  return (
    <SingleColumnSection>
      <SectionTitle title={preferredHeadingCase("Upcoming Events")} />
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

export default EventsUpcomingComponent;
