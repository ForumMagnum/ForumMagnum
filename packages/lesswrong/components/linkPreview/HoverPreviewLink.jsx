import React from 'react';
import { Components, registerComponent, parseRoute, Utils } from 'meteor/vulcan:core';
import { Link } from 'react-router-dom';
import { hostIsOnsite, useLocation, getUrlClass } from '../../lib/routeUtil';

// From react-router-v4
// https://github.com/ReactTraining/history/blob/master/modules/PathUtils.js
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

const HoverPreviewLink = ({ innerHTML, href}) => {
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
    
    if (hostIsOnsite(linkTargetAbsolute.host) || Meteor.isServer) {
      const onsiteUrl = linkTargetAbsolute.pathname + linkTargetAbsolute.search + linkTargetAbsolute.hash;
      const parsedUrl = parseRoute(parsePath(onsiteUrl));
      
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
