import React from "react";
import { generateUserPageMetadata } from "@/server/pageMetadata/userPageMetadata";
import RouteRoot from "@/components/layout/RouteRoot";
import ProfilePage from "./ProfilePage";

export const generateMetadata = generateUserPageMetadata;

export default function Page() {
  return <RouteRoot
    delayedStatusCode
  >
    <ProfilePage />
  </RouteRoot>;
}
