"use client";

import EventsUpcoming from '@/components/posts/EventsUpcoming';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Upcoming Events by Day</title></Helmet>
      <EventsUpcoming />
    </>
  );
}
