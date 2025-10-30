import React from "react";
import ResendVerificationEmailPage from '@/components/users/ResendVerificationEmailPage';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteHasWhiteBackground } from "@/components/layout/routeBackgroundColors";

assertRouteHasWhiteBackground("/resendVerificationEmail");

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Email Verification',
  });
}

export default function Page() {
  return <RouteRoot>
    <ResendVerificationEmailPage />
  </RouteRoot>;
}
