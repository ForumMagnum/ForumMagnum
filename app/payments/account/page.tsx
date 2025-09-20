import React from "react";
import EditPaymentInfoPage from '@/components/payments/EditPaymentInfoPage';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Account Payment Info',
  });
}

export default function Page() {
  return <RouteRoot>
    <EditPaymentInfoPage />
  </RouteRoot>
}
