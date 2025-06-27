import React from "react";
import PostsAnalyticsPage from '@/components/analytics/PostsAnalyticsPage';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";


export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ background: 'white' }} />
    <PostsAnalyticsPage />
  </>;
}
