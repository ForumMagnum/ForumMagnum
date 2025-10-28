import React from "react";
import PostsAnalyticsPage from '@/components/analytics/PostsAnalyticsPage';
import RouteRoot from "@/components/layout/RouteRoot";


export default function Page() {
  return <RouteRoot metadata={{ background: 'white' }}>
    <PostsAnalyticsPage />
  </RouteRoot>;
}
