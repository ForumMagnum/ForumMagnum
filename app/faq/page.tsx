import React from "react";
import PostsSingleRoute from '@/components/posts/PostsSingleRoute';
import RouteRoot from "@/components/next/RouteRoot";
import { faqPostIdSetting } from "@/lib/instanceSettings";

export default function Page() {
  return <RouteRoot delayedStatusCode metadata={{ background: 'white' }}>
    <PostsSingleRoute _id={faqPostIdSetting.get()} />
  </RouteRoot>;
}
