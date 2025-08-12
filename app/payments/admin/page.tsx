import React from "react";
import AdminPaymentsPage from '@/components/payments/AdminPaymentsPage';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Payments Admin',
  });
}

export default function Page() {
  return <AdminPaymentsPage />;
}
