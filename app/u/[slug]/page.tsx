import React from "react";
import UsersSingle from '@/components/users/UsersSingle';
import { generateUserPageMetadata } from "@/server/pageMetadata/userPageMetadata";

// eslint-disable-next-line no-barrel-files/no-barrel-files
export { generateUserPageMetadata as generateMetadata };

export default function Page() {
  return <UsersSingle />;
}
