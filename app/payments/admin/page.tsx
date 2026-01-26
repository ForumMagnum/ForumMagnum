import React from "react";
import AdminPaymentsPage from '@/components/payments/AdminPaymentsPage';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Payments Admin'));
}

export default function Page() {
  return <RouteRoot>
    <AdminPaymentsPage />
  </RouteRoot>
}
