import React from "react";
import PetrovDayPoll from '@/components/seasonal/petrovDay/PetrovDayPoll';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Petrov Day Poll',
  });
}

export default function Page() {
  return <PetrovDayPoll />;
}
