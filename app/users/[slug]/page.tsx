import React from "react";
import { generateUserPageMetadata } from "@/server/pageMetadata/userPageMetadata";
import RouteRoot from "@/components/layout/RouteRoot";
import ProfilePage from "./ProfilePage";

export const generateMetadata = generateUserPageMetadata;

export default async function Page({ params }: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  return <RouteRoot
    delayedStatusCode
  >
    <ProfilePage slug={slug}/>
  </RouteRoot>;
}
