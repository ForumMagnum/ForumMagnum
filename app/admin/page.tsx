import React from "react";
import AdminHome from '@/components/admin/AdminHome';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Admin'));
}

export default function Page() {
  return <AdminHome />;
}
