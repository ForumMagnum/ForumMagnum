"use client";

import React from 'react';
import SingleColumnSection from "../common/SingleColumnSection";
import SectionTitle from "../common/SectionTitle";
import PostsList2 from "./PostsList2";

const EventsUpcoming = () => {
  const terms = { view: 'upcomingEvents', limit: 20 } as const;

  return (
    <SingleColumnSection>
      <SectionTitle title={"Upcoming Events"} />
      <PostsList2 terms={terms}/>
    </SingleColumnSection>
  )
}

export default EventsUpcoming;


