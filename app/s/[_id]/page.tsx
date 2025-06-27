import React from "react";
import SequencesSingle from '@/components/sequences/SequencesSingle';
import { SequencesPageTitle } from '@/components/titles/SequencesPageTitle';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ _id: string }> }): Promise<Metadata> { /* TODO: fill this in! */ }

export default function Page() {
  // enableResourcePrefetch was: function
  
  return <>
    <RouteMetadataSetter metadata={{
      titleComponent: SequencesPageTitle,
      subtitleComponent: SequencesPageTitle
    }} />
    <SequencesSingle />
  </>;
}
