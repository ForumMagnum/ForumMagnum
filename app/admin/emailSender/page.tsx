import React from "react";
import EmailSenderPage from "@/components/admin/EmailSenderPage";
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: "Email Sender",
    robots: { index: false },
  });
}

export default function Page() {
  return <RouteRoot>
    <EmailSenderPage />
  </RouteRoot>;
}


