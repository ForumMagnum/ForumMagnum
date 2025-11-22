import React from "react";
import RouteRoot from "@/components/next/RouteRoot";
import QueryLogVisualizer from "@/components/admin/QueryLogVisualizer";

export default function Page() {
  return (
    <RouteRoot>
      <QueryLogVisualizer />
    </RouteRoot>
  );
}

