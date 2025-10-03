import React from "react";
import ResendVerificationEmailPage from '@/components/users/ResendVerificationEmailPage';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Email Verification',
  });
}

export default function Page() {
  return <RouteRoot metadata={{ background: 'white' }}>
    <ResendVerificationEmailPage />
  </RouteRoot>;
}
