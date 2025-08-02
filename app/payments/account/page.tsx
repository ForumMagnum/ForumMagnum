import React from "react";
import EditPaymentInfoPage from '@/components/payments/EditPaymentInfoPage';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge({}, defaultMetadata, {
    title: 'Account Payment Info',
  });
}

export default function Page() {
  return <EditPaymentInfoPage />;
}
