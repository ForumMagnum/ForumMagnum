import React from 'react';
import { Components, registerComponent, parseRoute, Utils } from 'meteor/vulcan:core';
import { Link } from 'react-router-dom';
import { hostIsOnsite, useLocation, getUrlClass } from '../../lib/routeUtil';
import { withStyles } from '@material-ui/core/styles';

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

const styles = theme => ({
  root: {
    position: "relative",
  },
  indicator: {
    position: "relative",
    top: -5,
    fontSize: 8,
    display: "inline-block",
    zIndex: 1,
    fontWeight: 700,
    color: theme.palette.primary.main
  }
})

const HoverPreviewLink = ({classes, innerHTML, href}) => {
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

  const currentURL = new URLClass(location.pathname, Utils.getSiteUrl());
  const linkTargetAbsolute = new URLClass(href, currentURL);
  
  if (hostIsOnsite(linkTargetAbsolute.host) || Meteor.isServer) {
    const onsiteUrl = linkTargetAbsolute.pathname + linkTargetAbsolute.search + linkTargetAbsolute.hash;
    const parsedUrl = parseRoute(parsePath(linkTargetAbsolute.pathname));
    
    if (parsedUrl?.currentRoute) {
      const PreviewComponent = parsedUrl.currentRoute?.previewComponentName ? Components[parsedUrl.currentRoute.previewComponentName] : null;
      
      if (PreviewComponent) {
        return <span className={classes.root}>
          <PreviewComponent href={onsiteUrl} targetLocation={parsedUrl} innerHTML={innerHTML}/>
          <span className={classes.indicator}>LW</span>
        </span>
      } else {
        return <Link to={onsiteUrl} dangerouslySetInnerHTML={{__html: innerHTML}} />
      }
    }
  }
  return <a href={href} dangerouslySetInnerHTML={{__html: innerHTML}} />
}
registerComponent('HoverPreviewLink', HoverPreviewLink, withStyles(styles, {name:"HoverPreviewLink"}));
