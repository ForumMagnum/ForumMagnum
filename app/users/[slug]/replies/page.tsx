import React from "react";
import UserCommentsReplies from '@/components/comments/UserCommentsReplies';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge(defaultMetadata, {
    title: 'User Comment Replies',
  });
}

export default function Page() {
  return <UserCommentsReplies />;
}
