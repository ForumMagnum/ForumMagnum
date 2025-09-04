import React from "react";
import PostsSingleRoute from '@/components/posts/PostsSingleRoute';
import RouteRoot from "@/components/next/RouteRoot";

export default function Page() {
  return <RouteRoot delayedStatusCode metadata={{ background: 'white' }}>
    <PostsSingleRoute _id="2rWKkWuPrgTMpLRbp" />
  </RouteRoot>;
}
