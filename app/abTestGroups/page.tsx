import React from "react";
import UsersViewABTests from '@/components/users/UsersViewABTests';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge(defaultMetadata, {
    title: 'A/B Test Groups',
  });
}

export default function Page() {
  return <UsersViewABTests />;
}
