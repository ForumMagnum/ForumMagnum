import React from "react";
import ResendVerificationEmailPage from '@/components/users/ResendVerificationEmailPage';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Email Verification',
  });
}

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ background: 'white' }} />
    <ResendVerificationEmailPage />
  </>;
}
