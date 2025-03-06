"use client";

import EventsPast from '@/components/posts/EventsPast';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Past Events by Day</title></Helmet>
      <EventsPast />
    </>
  );
}
