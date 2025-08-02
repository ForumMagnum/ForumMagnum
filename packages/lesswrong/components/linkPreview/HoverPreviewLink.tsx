import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { getSiteUrl } from '../../lib/vulcan-lib/utils';
import {parsePath, parseRoute2} from '../../lib/vulcan-core/appContext'
import { classifyHost, useLocation } from '../../lib/routeUtil';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import withErrorBoundary from '../common/withErrorBoundary';
import { locationHashIsFootnote, locationHashIsFootnoteBackreference } from '../contents/CollapsedFootnotes';
import { getUrlClass } from '@/server/utils/getUrlClass';
import type { ContentStyleType } from '../common/ContentStyles';
import { DefaultPreview, MetaculusPreview, ManifoldPreview, FatebookPreview, NeuronpediaPreview, MetaforecastPreview, OWIDPreview, ArbitalPreview, EstimakerPreview, ViewpointsPreview, SequencePreview, PostLinkPreviewSequencePost, PostLinkPreviewSlug, PostLinkPreview, PostCommentLinkPreviewGreaterWrong } from '@/components/linkPreview/PostLinkPreview';
import FootnotePreview from "./FootnotePreview";
import { NoSideItems } from '../contents/SideItems';

import { TagHoverPreview } from '@/components/tagging/TagHoverPreview';

export const routePreviewComponentMapping = {
  '/sequences/:_id': SequencePreview,
  '/s/:_id': SequencePreview,
  '/s/:sequenceId/p/:postId': PostLinkPreviewSequencePost,
  '/highlights/:slug': PostLinkPreviewSlug,
  '/w/:slug': TagHoverPreview,
  '/w/:slug/discussion': TagHoverPreview,
  '/hpmor/:slug': PostLinkPreviewSlug,
  '/codex/:slug': PostLinkPreviewSlug,
  '/rationality/:slug': PostLinkPreviewSlug,
  '/events/:_id/:slug?': PostLinkPreview,
  '/g/:groupId/p/:_id': PostLinkPreview,
  '/posts/:_id/:slug?': PostLinkPreview,
  '/posts/slug/:slug?': PostLinkPreviewSlug,
  '/posts/:_id/:slug/comment/:commentId?': PostCommentLinkPreviewGreaterWrong,
};

export const parseRouteWithErrors = (onsiteUrl: string, contentSourceDescription?: string) => {
  return parseRoute2({
    location: parsePath(onsiteUrl),
    onError: (pathname) => {
      // Don't capture broken links in Sentry (too spammy, but maybe we'll
      // put this back some day).
      //if (isClient) {
      //  if (contentSourceDescription)
      //    Sentry.captureException(new Error(`Broken link from ${contentSourceDescription} to ${pathname}`));
      //  else
      //    Sentry.captureException(new Error(`Broken link from ${location.pathname} to ${pathname}`));
      //}
    },
    routePatterns: Object.keys(routePreviewComponentMapping).reverse() as (keyof typeof routePreviewComponentMapping)[]
  });
}

export const linkIsExcludedFromPreview = (url: string): boolean => {
  // Don't try to preview special JS links
  if (!url || url==="#" || url==="")
    return true;
  
  // Don't try to preview links that go directly to images. The usual use case
  // for such links is an image where you click for a larger version.
  return !!(url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.gif'));


}

// A link, which will have a hover preview auto-selected and attached. Used from
// ContentItemBody as a replacement for <a> tags in user-provided content.
// Props
//   href: The link destination, the href attribute on the original <a> tag.
//   contentSourceDescription: (Optional) A human-readabe string describing
//     where this content came from. Used in error logging only, not displayed
//     to users.
const HoverPreviewLink = ({ href, contentSourceDescription, id, rel, noPrefetch, contentStyleType, className, children }: {
  href: string,
  contentSourceDescription?: string,
  id?: string,
  rel?: string,
  // Only Implemented for Tag Hover Previews
  noPrefetch?: boolean,
  contentStyleType?: ContentStyleType,
  className?: string,
  children: React.ReactNode,
}) => {
  const URLClass = getUrlClass()
  const location = useLocation();

  // Invalid link with no href? Don't transform it.
  if (!href) {
    return <a href={href} id={id} rel={rel} className={className}>
      {children}
    </a>
  }

  // Within-page relative link?
  if (href.startsWith("#")) {
    if (locationHashIsFootnote(href)){
      return <FootnotePreview href={href} id={id} rel={rel} contentStyleType={contentStyleType}>
        {children}
      </FootnotePreview>
    } else if (locationHashIsFootnoteBackreference(href)) {
      return <a href={href} id={id} rel={rel} className={className}>
        {children}
      </a>
    }
  }

  try {
    const currentURL = new URLClass(location.url, getSiteUrl());
    const linkTargetAbsolute = new URLClass(href, currentURL);

    const onsiteUrl = linkTargetAbsolute.pathname + linkTargetAbsolute.search + linkTargetAbsolute.hash;
    const hostType = classifyHost(linkTargetAbsolute.host)
    if (!linkIsExcludedFromPreview(onsiteUrl) && (hostType==="onsite" || hostType==="mirrorOfUs")) {
      const parsedUrl = parseRouteWithErrors(onsiteUrl, contentSourceDescription)
      const destinationUrl = hostType==="onsite" ? parsedUrl.url : href;

      if (parsedUrl.routePattern) {
        const PreviewComponent = routePreviewComponentMapping[parsedUrl.routePattern];
        const previewComponentName = PreviewComponent?.name;

        if (PreviewComponent) {
          return <AnalyticsContext pageElementContext="linkPreview" href={destinationUrl} hoverPreviewType={previewComponentName} onsite>
            <NoSideItems>
              <PreviewComponent href={destinationUrl} targetLocation={parsedUrl} id={id ?? ''} noPrefetch={noPrefetch} className={className}>
                {children}
              </PreviewComponent>
            </NoSideItems>
          </AnalyticsContext>
        } else {
          return <DefaultPreview href={href} id={id} rel={rel} className={className}>
            {children}
          </DefaultPreview>
        }
      }
    } else {
      if (linkTargetAbsolute.host === "metaculus.com" || linkTargetAbsolute.host === "www.metaculus.com") {
        return <MetaculusPreview href={href} id={id} className={className}>
          {children}
        </MetaculusPreview>
      }
      if (linkTargetAbsolute.host === "manifold.markets" || linkTargetAbsolute.host === "www.manifold.markets") {
        return <ManifoldPreview href={href} id={id} className={className}>
          {children}
        </ManifoldPreview>
      }

      if (linkTargetAbsolute.host === "fatebook.io" || linkTargetAbsolute.host === "www.fatebook.io") {
        return <FatebookPreview href={href} id={id} className={className}>
          {children}
        </FatebookPreview>
      }
      if (linkTargetAbsolute.host === "neuronpedia.org" || linkTargetAbsolute.host === "www.neuronpedia.org") {
        return <NeuronpediaPreview href={href} id={id} className={className}>
          {children}
        </NeuronpediaPreview>
      }
      if (linkTargetAbsolute.host === "metaforecast.org" || linkTargetAbsolute.host === "www.metaforecast.org") {
        return <MetaforecastPreview href={href} id={id} className={className}>
          {children}
        </MetaforecastPreview>
      }
      if (linkTargetAbsolute.host === "ourworldindata.org") {
        return <OWIDPreview href={href} id={id} className={className}>
          {children}
        </OWIDPreview>
      }
      if (linkTargetAbsolute.host === "arbital.com" || linkTargetAbsolute.host === "www.arbital.com") {
        return <ArbitalPreview href={href} id={id} className={className}>
          {children}
        </ArbitalPreview>
      }
      if (linkTargetAbsolute.host === "estimaker.app" || linkTargetAbsolute.host === "www.estimaker.app") {
        return <EstimakerPreview href={href} id={id} className={className}>
          {children}
        </EstimakerPreview>
      }
      if (linkTargetAbsolute.host === "viewpoints.xyz" || linkTargetAbsolute.host === "www.viewpoints.xyz") {
        return <ViewpointsPreview href={href} id={id} className={className}>
          {children}
        </ViewpointsPreview>
      }
      return <DefaultPreview href={href} id={id} rel={rel} className={className}>
        {children}
      </DefaultPreview>
    }
    return <a href={href} id={id} rel={rel} className={className}>
      {children}
    </a>
  } catch (err) {
    console.error(err) // eslint-disable-line
    console.error(href) // eslint-disable-line
    return <a href={href} id={id} rel={rel} className={className}>
      {children}
    </a>
  }

}

export default registerComponent('HoverPreviewLink', HoverPreviewLink, { hocs: [withErrorBoundary] });


