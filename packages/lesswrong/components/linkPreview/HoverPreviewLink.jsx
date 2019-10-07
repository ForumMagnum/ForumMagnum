import React from 'react';
import { Components, registerComponent, parseRoute, Utils } from 'meteor/vulcan:core';
import { Link } from 'react-router-dom';
import { hostIsOnsite, useLocation, getUrlClass } from '../../lib/routeUtil';
import Sentry from '@sentry/node';

// From react-router-v4
// https://github.com/ReactTraining/history/blob/master/modules/PathUtils.js
export const parsePath = function parsePath(path) {
  var pathname = path || '/';
  var search = '';
  var hash = '';
  
  var hashIndex = pathname.indexOf('#');
  if (hashIndex !== -1) {
    hash = pathname.substr(hashIndex);
    pathname = pathname.substr(0, hashIndex);
  }
  
  var searchIndex = pathname.indexOf('?');
  if (searchIndex !== -1) {
    search = pathname.substr(searchIndex);
    pathname = pathname.substr(0, searchIndex);
  }
  
  return {
    pathname: pathname,
    search: search === '?' ? '' : search,
    hash: hash === '#' ? '' : hash
  };
};

const linkIsExcludedFromPreview = (url) => {
  // Don't try to preview links that go directly to images. The usual use case
  // for such links is an image where you click for a larger version.
  if (url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.gif')) {
    return true;
  }
  
  return false;
}

// A link, which will have a hover preview auto-selected and attached. Used from
// ContentItemBody as a replacement for <a> tags in user-provided content.
// Props
//   innerHTML: The contents of the original <a> tag, which get wrapped in a
//     new link and preview.
//   href: The link destination, the href attribute on the original <a> tag.
//   contentSourceDescription: (Optional) A human-readabe string describing
//     where this content came from. Used in error logging only, not displayed
//     to users.
const HoverPreviewLink = ({ innerHTML, href, contentSourceDescription }) => {
  const URLClass = getUrlClass()
  const location = useLocation();

  // Invalid link with no href? Don't transform it.
  if (!href) {
    return <a href={href} dangerouslySetInnerHTML={{__html: innerHTML}} />
  }
  
  // Within-page relative link?
  if (href.startsWith("#")) {
    return <Link to={href} dangerouslySetInnerHTML={{__html: innerHTML}} />
  }

  try {
    const currentURL = new URLClass(location.pathname, Utils.getSiteUrl());
    const linkTargetAbsolute = new URLClass(href, currentURL);
    
    const onsiteUrl = linkTargetAbsolute.pathname + linkTargetAbsolute.search + linkTargetAbsolute.hash;
    if (!linkIsExcludedFromPreview(onsiteUrl) && (hostIsOnsite(linkTargetAbsolute.host) || Meteor.isServer)) {
      const parsedUrl = parseRoute({
        location: parsePath(onsiteUrl),
        onError: (pathname) => {
          if (Meteor.isClient) {
            if (contentSourceDescription)
              Sentry.captureException(new Error(`Broken link from ${contentSourceDescription} to ${pathname}`));
            else
              Sentry.captureException(new Error(`Broken link from ${location.pathname} to ${pathname}`));
          }
        }
      });
      
      if (parsedUrl?.currentRoute) {
        const PreviewComponent = parsedUrl.currentRoute?.previewComponentName ? Components[parsedUrl.currentRoute.previewComponentName] : null;
        
        if (PreviewComponent) {
          return <PreviewComponent href={onsiteUrl} targetLocation={parsedUrl} innerHTML={innerHTML}/>
        } else {
          return <Components.DefaultPreview href={href} innerHTML={innerHTML} onSite/>
        }
      }
    } else {
      return <Components.DefaultPreview href={href} innerHTML={innerHTML}/>
    }
    return <a href={href} dangerouslySetInnerHTML={{__html: innerHTML}} />
  } catch (err) {
    console.error(err) // eslint-disable-line
    console.error(href, innerHTML) // eslint-disable-line
    return <a href={href} dangerouslySetInnerHTML={{__html: innerHTML}} />
  }

}
registerComponent('HoverPreviewLink', HoverPreviewLink);
