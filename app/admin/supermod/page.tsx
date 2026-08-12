import React from "react";
import ModerationInbox from '@/components/sunshineDashboard/supermod/ModerationInbox';
import { getDefaultMetadata, getPageTitleFields, getResolverContextForGenerateMetadata, handleMetadataError } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";
import { gql } from "@/lib/generated/gql-codegen";
import { runQuery } from "@/server/vulcan-lib/query";
import { userGetDisplayName } from "@/lib/collections/users/helpers";
import { getModerationInboxTitle } from "@/components/sunshineDashboard/supermod/helpers";

const ModeratedUserMetadataQuery = gql(`
  query ModeratedUserMetadata($documentId: String) {
    user(selector: { documentId: $documentId }) {
      result {
        _id
        displayName
        username
        fullName
      }
    }
  }
`);

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ user?: string }> }): Promise<Metadata> {
  const [searchParamsValues, defaultMetadata] = await Promise.all([searchParams, getDefaultMetadata()]);
  const { user: moderatedUserId } = searchParamsValues;

  if (!moderatedUserId) {
    return merge({}, defaultMetadata, getPageTitleFields(getModerationInboxTitle(null)));
  }

  try {
    const resolverContext = await getResolverContextForGenerateMetadata(searchParamsValues);
    const { data } = await runQuery(ModeratedUserMetadataQuery, { documentId: moderatedUserId }, resolverContext);
    const moderatedUser = data?.user?.result;
    const displayName = moderatedUser ? userGetDisplayName(moderatedUser) : null;
    return merge({}, defaultMetadata, getPageTitleFields(getModerationInboxTitle(displayName || null)));
  } catch (error) {
    return handleMetadataError('Error generating moderation inbox metadata', error);
  }
}

assertRouteAttributes("/admin/supermod", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export default function Page() {
  return <RouteRoot noFooter>
    <ModerationInbox />
  </RouteRoot>
}
