import React from "react";
import { EmailHistoryPage } from '@/components/sunshineDashboard/EmailHistory';
import RouteRoot from "@/components/layout/RouteRoot";


export default function Page() {
  return <RouteRoot>
    <EmailHistoryPage />
  </RouteRoot>
}
