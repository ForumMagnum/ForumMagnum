"use client";

import PetrovDayPoll from '@/components/seasonal/petrovDay/PetrovDayPoll';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Petrov Day Poll</title></Helmet>
      <PetrovDayPoll />
    </>
  );
}
