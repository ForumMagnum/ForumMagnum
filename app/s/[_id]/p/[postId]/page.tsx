import React from "react";
import SequencesPost from '@/components/sequences/SequencesPost';
import { getPostPageMetadataFunction } from "@/server/pageMetadata/postPageMetadata";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteHasWhiteBackground } from "@/components/layout/routeBackgroundColors";

assertRouteHasWhiteBackground("/s/[_id]/p/[postId]");

export const generateMetadata = getPostPageMetadataFunction<{ _id: string; postId: string }>(({ postId }) => postId);

export default function Page() {
  return <RouteRoot>
    <SequencesPost />
  </RouteRoot>;
}
