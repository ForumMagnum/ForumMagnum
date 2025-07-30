import React from "react";
import AdminGoogleServiceAccount from '@/components/admin/AdminGoogleServiceAccount';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge({}, defaultMetadata, {
    title: 'Google Doc import service account',
  });
}

export default function Page() {
  return <AdminGoogleServiceAccount />;
}
