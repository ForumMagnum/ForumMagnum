import React from "react";
import TagPageRouter from '@/components/tagging/TagPageRouter';
import { TagPageTitle } from '@/components/tagging/TagPageTitle';
import { getTagPageMetadataFunction } from "@/server/pageMetadata/tagPageMetadata";
import RouteRoot from "@/components/next/RouteRoot";
import { GUIDE_PATH_PAGES_MAPPING } from "@/lib/arbital/paths";
import { tagGetUrl } from "@/lib/collections/tags/helpers";
import PermanentRedirect from "@/components/common/PermanentRedirect";

export const generateMetadata = getTagPageMetadataFunction<{ slug: string }>(({ slug }) => slug);

export default async function Page({ params, searchParams }: { params: Promise<{ slug: string }>, searchParams: Promise<{ startPath?: string }> }) {
  // enableResourcePrefetch was: function

  const [{ slug }, searchParamValues] = await Promise.all([params, searchParams]);
  // This needs to be an `in` because startPath will be an empty string,
  // for legacy Arbital compatibility reasons.
  if ('startPath' in searchParamValues && slug in GUIDE_PATH_PAGES_MAPPING) {
    const firstPathPageId = GUIDE_PATH_PAGES_MAPPING[slug as keyof typeof GUIDE_PATH_PAGES_MAPPING][0];
    const redirectUrl = tagGetUrl({ slug: firstPathPageId }, { pathId: slug });
    return <RouteRoot delayedStatusCode>
      <PermanentRedirect url={redirectUrl} />
    </RouteRoot>
  }
  
  return <RouteRoot
    delayedStatusCode
    metadata={{
      background: 'white',
      titleComponent: TagPageTitle,
      subtitleComponent: TagPageTitle
    }}
  >
    <TagPageRouter />
  </RouteRoot>
}
