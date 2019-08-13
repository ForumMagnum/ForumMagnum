import React from 'react';
import { Components, registerComponent, parseRoute, Utils } from 'meteor/vulcan:core';
import { Link } from 'react-router-dom';
import { hostIsOffsite, useLocation } from '../../lib/routeUtil';

// From react-router-v4
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
  // FIXME: This is currently server-side-only because 'URL' is a browser-API
  // class. See the workaround for the same issue in PostsPage.
  const location = useLocation();
  const currentURL = new URL(location.pathname, Utils.getSiteUrl());
  const linkTargetAbsolute = new URL(href, currentURL);
  
  if (hostIsOffsite(linkTargetAbsolute.host) || !Meteor.isClient) {
    return <a href={href} dangerouslySetInnerHTML={{__html: innerHTML}} />
  } else {
    const onsiteUrl = linkTargetAbsolute.pathname + linkTargetAbsolute.search + linkTargetAbsolute.hash;
    const parsedUrl = parseRoute(parsePath(linkTargetAbsolute.pathname));
    const PreviewComponent = parsedUrl.currentRoute?.previewComponentName ? Components[parsedUrl.currentRoute.previewComponentName] : null;
    
    if (PreviewComponent) {
      console.log("Rendering PreviewComponent");
      return <PreviewComponent href={onsiteUrl} targetLocation={parsedUrl} innerHTML={innerHTML}/>
    } else {
      console.log("PreviewComponent not found");
      return <Link to={onsiteUrl} dangerouslySetInnerHTML={{__html: innerHTML}} />
    }
  }
}
registerComponent('HoverPreviewLink', HoverPreviewLink);
