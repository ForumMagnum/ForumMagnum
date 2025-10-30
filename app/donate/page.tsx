import React from "react";
import PostsSingleRoute from '@/components/posts/PostsSingleRoute';
import RouteRoot from "@/components/next/RouteRoot";
import { suggestedTimeouts } from "@/server/pageTimeouts";

export const maxDuration = suggestedTimeouts.postPage;


export default function Page() {
  return <RouteRoot delayedStatusCode metadata={{ background: 'white' }}>
    <PostsSingleRoute _id="LcpQQvcpWfPXvW7R9" />
  </RouteRoot>;
}
