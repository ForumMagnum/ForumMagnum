import React from "react";
import CollectionsSingle from '@/components/sequences/CollectionsSingle';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";


export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ hasLeftNavigationColumn: true }} />
    <CollectionsSingle />
  </>;
}
