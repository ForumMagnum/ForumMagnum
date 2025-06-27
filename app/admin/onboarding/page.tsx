import React from "react";
import AdminViewOnboarding from '@/components/admin/AdminViewOnboarding';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge(defaultMetadata, {
    title: 'Onboarding (for testing purposes)',
  });
}

export default function Page() {
  return <AdminViewOnboarding />;
}
