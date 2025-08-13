import React from "react";
import UsersSingle from '@/components/users/UsersSingle';
import { generateUserPageMetadata } from "@/server/pageMetadata/userPageMetadata";

export const generateMetadata = generateUserPageMetadata;

export default function Page() {
  return <UsersSingle />;
}
