import React from "react";
import PostsEditPage from '@/components/posts/PostsEditPage';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";


export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ background: 'white' }} />
    <PostsEditPage />
  </>;
}
