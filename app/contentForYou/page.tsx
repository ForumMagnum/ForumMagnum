import React, { Suspense } from "react";
import type { Metadata } from "next";
import merge from "lodash/merge";
import { ContentForYouPage } from "@/components/aiDigest/ContentForYouPage";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields("Content for You"), {
    robots: { index: false },
  });
}

assertRouteAttributes("/contentForYou", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export default function Page() {
  return (
    <RouteRoot>
      <Suspense fallback={null}>
        <ContentForYouPage />
      </Suspense>
    </RouteRoot>
  );
}
