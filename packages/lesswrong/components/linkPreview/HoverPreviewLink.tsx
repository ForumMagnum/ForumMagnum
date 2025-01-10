import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { getSiteUrl } from '../../lib/vulcan-lib/utils';
import {parseRoute, parsePath, checkUserRouteAccess} from '../../lib/vulcan-core/appContext'
import { classifyHost, useLocation } from '../../lib/routeUtil';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { isServer } from '../../lib/executionEnvironment';
import withErrorBoundary from '../common/withErrorBoundary';
import { isMobile } from '../../lib/utils/isMobile'
import { locationHashIsFootnote } from '../posts/PostsPage/CollapsedFootnotes';
import {useCurrentUser} from '../common/withUser'
import { getUrlClass } from '@/server/utils/getUrlClass';

export const parseRouteWithErrors = (onsiteUrl: string, contentSourceDescription?: string) => {
  return parseRoute({
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
    }
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
const HoverPreviewLink = ({ href, contentSourceDescription, id, rel, noPrefetch, children }: {
  href: string,
  contentSourceDescription?: string,
  id?: string,
  rel?: string,
  // Only Implemented for Tag Hover Previews
  noPrefetch?: boolean,
  
  children: React.ReactNode,
}) => {
  const URLClass = getUrlClass()
  const location = useLocation();
  const currentUser = useCurrentUser()

  // Invalid link with no href? Don't transform it.
  if (!href) {
    return <a href={href} id={id} rel={rel}>
      {children}
    </a>
  }

  // Within-page relative link?
  if (href.startsWith("#")) {
    if (locationHashIsFootnote(href)){
      return <Components.FootnotePreview href={href} id={id} rel={rel}>
        {children}
      </Components.FootnotePreview>
    }
    return <a href={href} id={id} rel={rel}>
      {children}
    </a>
  }

  try {
    const currentURL = new URLClass(location.url, getSiteUrl());
    const linkTargetAbsolute = new URLClass(href, currentURL);

    const onsiteUrl = linkTargetAbsolute.pathname + linkTargetAbsolute.search + linkTargetAbsolute.hash;
    const hostType = classifyHost(linkTargetAbsolute.host)
    if (!linkIsExcludedFromPreview(onsiteUrl) && (hostType==="onsite" || hostType==="mirrorOfUs" || isServer)) {
      const parsedUrl = checkUserRouteAccess(currentUser, parseRouteWithErrors(onsiteUrl, contentSourceDescription))
      const destinationUrl = hostType==="onsite" ? parsedUrl.url : href;

      if (parsedUrl.currentRoute) {
        const PreviewComponent: any = parsedUrl.currentRoute.previewComponentName ? Components[parsedUrl.currentRoute.previewComponentName] : null;

        if (PreviewComponent) {
          return <AnalyticsContext pageElementContext="linkPreview" href={destinationUrl} hoverPreviewType={parsedUrl.currentRoute.previewComponentName} onsite>
            <PreviewComponent href={destinationUrl} targetLocation={parsedUrl} id={id} noPrefetch={noPrefetch}>
              {children}
            </PreviewComponent>
          </AnalyticsContext>
        } else {
          return <Components.DefaultPreview href={href} id={id} rel={rel}>
            {children}
          </Components.DefaultPreview>
        }
      }
    } else {
      if (linkTargetAbsolute.host === "hubs.mozilla.com") {
        return <Components.MozillaHubPreview href={href} id={id}>
          {children}
        </Components.MozillaHubPreview>
      }
      if (linkTargetAbsolute.host === "metaculus.com" || linkTargetAbsolute.host === "www.metaculus.com") {
        return <Components.MetaculusPreview href={href} id={id}>
          {children}
        </Components.MetaculusPreview>
      }
      if (linkTargetAbsolute.host === "manifold.markets" || linkTargetAbsolute.host === "www.manifold.markets") {
        return <Components.ManifoldPreview href={href} id={id}>
          {children}
        </Components.ManifoldPreview>
      }

      if (linkTargetAbsolute.host === "fatebook.io" || linkTargetAbsolute.host === "www.fatebook.io") {
        return <Components.FatebookPreview href={href} id={id}>
          {children}
        </Components.FatebookPreview>
      }
      if (linkTargetAbsolute.host === "neuronpedia.org" || linkTargetAbsolute.host === "www.neuronpedia.org") {
        return <Components.NeuronpediaPreview href={href} id={id}>
          {children}
        </Components.NeuronpediaPreview>
      }
      if (linkTargetAbsolute.host === "metaforecast.org" || linkTargetAbsolute.host === "www.metaforecast.org") {
        return <Components.MetaforecastPreview href={href} id={id}>
          {children}
        </Components.MetaforecastPreview>
      }
      if (linkTargetAbsolute.host === "ourworldindata.org") {
        return <Components.OWIDPreview href={href} id={id}>
          {children}
        </Components.OWIDPreview>
      }
      if (linkTargetAbsolute.host === "arbital.com" || linkTargetAbsolute.host === "www.arbital.com") {
        return <Components.ArbitalPreview href={href} id={id}>
          {children}
        </Components.ArbitalPreview>
      }
      if (linkTargetAbsolute.host === "estimaker.app" || linkTargetAbsolute.host === "www.estimaker.app") {
        return <Components.EstimakerPreview href={href} id={id}>
          {children}
        </Components.EstimakerPreview>
      }
      if (linkTargetAbsolute.host === "viewpoints.xyz" || linkTargetAbsolute.host === "www.viewpoints.xyz") {
        return <Components.ViewpointsPreview href={href} id={id}>
          {children}
        </Components.ViewpointsPreview>
      }
      return <Components.DefaultPreview href={href} id={id} rel={rel}>
        {children}
      </Components.DefaultPreview>
    }
    return <a href={href} id={id} rel={rel}>
      {children}
    </a>
  } catch (err) {
    console.error(err) // eslint-disable-line
    console.error(href) // eslint-disable-line
    return <a href={href} id={id} rel={rel}>
      {children}
    </a>
  }

}

const HoverPreviewLinkComponent = registerComponent('HoverPreviewLink', HoverPreviewLink, { hocs: [withErrorBoundary] });

declare global {
  interface ComponentTypes {
    HoverPreviewLink: typeof HoverPreviewLinkComponent
  }
}
