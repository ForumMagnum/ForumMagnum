import React from "react";
import UserCommentsReplies from '@/components/comments/UserCommentsReplies';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'User Comment Replies',
  });
}

export default function Page() {
  return <RouteRoot>
    <UserCommentsReplies />
  </RouteRoot>
}
