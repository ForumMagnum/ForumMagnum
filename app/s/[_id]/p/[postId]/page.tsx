import React from "react";
import SequencesPost from '@/components/sequences/SequencesPost';
import { getPostPageMetadataFunction } from "@/server/pageMetadata/postPageMetadata";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteHasWhiteBackground } from "@/lib/routeChecks/routeBackgroundColors";

assertRouteHasWhiteBackground("/s/[_id]/p/[postId]");

export const generateMetadata = getPostPageMetadataFunction<{ _id: string; postId: string }>(({ postId }) => postId);

export default async function Page({ params }: {
  params: Promise<{ _id: string; postId: string }>
}) {
  const { _id, postId } = await params;
  return <RouteRoot>
    <SequencesPost postId={postId} sequenceId={_id} />
  </RouteRoot>;
}
