import React from "react";
import PostsNewForm from '@/components/posts/PostsNewForm';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteHasWhiteBackground } from "@/components/layout/routeBackgroundColors";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('New Post'));
}

assertRouteHasWhiteBackground("/newPost");

export default function Page() {
  return <RouteRoot>
    <PostsNewForm />
  </RouteRoot>;
}
