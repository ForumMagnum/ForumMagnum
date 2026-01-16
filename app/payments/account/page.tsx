import React from "react";
import EditPaymentInfoPage from '@/components/payments/EditPaymentInfoPage';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Account Payment Info'));
}

export default function Page() {
  return <RouteRoot>
    <EditPaymentInfoPage />
  </RouteRoot>
}
