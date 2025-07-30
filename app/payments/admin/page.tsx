import React from "react";
import AdminPaymentsPage from '@/components/payments/AdminPaymentsPage';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge({}, defaultMetadata, {
    title: 'Payments Admin',
  });
}

export default function Page() {
  return <AdminPaymentsPage />;
}
