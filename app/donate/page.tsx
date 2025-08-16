import React from "react";
import PostsSingleRoute from '@/components/posts/PostsSingleRoute';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";


export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ background: 'white' }} />
    <PostsSingleRoute _id="LcpQQvcpWfPXvW7R9" />
  </>;
}
