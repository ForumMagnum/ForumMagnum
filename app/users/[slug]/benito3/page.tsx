import React from "react";
import { UserPageTitle } from '@/components/titles/UserPageTitle';
import { generateUserPageMetadata } from "@/server/pageMetadata/userPageMetadata";
import RouteRoot from "@/components/layout/RouteRoot";
import ProfilePage from "../ProfilePage";
import "../styles.css";

export const generateMetadata = generateUserPageMetadata;

export default function Page() {
  return <RouteRoot
    delayedStatusCode
    metadata={{ titleComponent: UserPageTitle }}
  >
    <div className="habryka-page">
      <ProfilePage variant="benito3" />
    </div>
  </RouteRoot>;
}
