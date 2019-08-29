import React from 'react';
import { Components, registerComponent, parseRoute, Utils } from 'meteor/vulcan:core';
import { Link } from 'react-router-dom';
import { hostIsOnsite, useLocation } from '../../lib/routeUtil';

// From react-router-v4
// TODO: add a link to the github repo where this is from
var parsePath = function parsePath(path) {
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

const HoverPreviewLink = ({innerHTML, href}) => {
  // FIXME: This is currently client-side-only because 'URL' is a browser-API
  // class. See the workaround for the same issue in PostsPage.
  const location = useLocation();
  
  // Invalid link with no href? Don't transform it.
  if (!href) {
    return <a href={href} dangerouslySetInnerHTML={{__html: innerHTML}} />
  }
  
  // Within-page relative link?
  if (href.startsWith("#")) {
    return <Link to={href} dangerouslySetInnerHTML={{__html: innerHTML}} />
  }

  const currentURL = new URL(location.pathname, Utils.getSiteUrl());
  const linkTargetAbsolute = new URL(href, currentURL);
  
  if (hostIsOnsite(linkTargetAbsolute.host) || !Meteor.isClient) {
    const onsiteUrl = linkTargetAbsolute.pathname + linkTargetAbsolute.search + linkTargetAbsolute.hash;
    const parsedUrl = parseRoute(parsePath(linkTargetAbsolute.pathname));
    
    if (parsedUrl?.currentRoute) {
      const PreviewComponent = parsedUrl.currentRoute?.previewComponentName ? Components[parsedUrl.currentRoute.previewComponentName] : null;
      
      if (PreviewComponent) {
        return <PreviewComponent href={onsiteUrl} targetLocation={parsedUrl} innerHTML={innerHTML}/>
      } else {
        return <Link to={onsiteUrl} dangerouslySetInnerHTML={{__html: innerHTML}} />
      }
    } else {
      return <a href={href} dangerouslySetInnerHTML={{__html: innerHTML}} />
    }
  } else {
    return <a href={href} dangerouslySetInnerHTML={{__html: innerHTML}} />
  }
}
registerComponent('HoverPreviewLink', HoverPreviewLink);
