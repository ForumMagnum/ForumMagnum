import React from "react";
import AdminPaymentsPage from '@/components/payments/AdminPaymentsPage';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Payments Admin',
  });
}

export default function Page() {
  return <RouteRoot>
    <AdminPaymentsPage />
  </RouteRoot>
}
