/* eslint-disable no-useless-escape */
/* eslint-disable eqeqeq */
/* eslint-disable no-control-regex */
/* eslint-disable @stylistic/ts/type-annotation-spacing */

import { DomainsRow, PageInfosRow, PagesRow } from './arbitalSchema';
// import app from './angular.ts';
import {isLive, isIntIdValid} from './util';

// arb.urlService handles working with URLs

// let that = this;

// This will be set to true before loading content for a second page
// this.hasLoadedFirstPage = false;

// Return current URL.
// this.getAbsUrl = function(options): string {
//   var absUrl = $location.absUrl();
//   if (options.noHash) {
//     var lastHash = absUrl.lastIndexOf('#');
//     if (lastHash >= 0) {
//       absUrl = absUrl.substring(0, lastHash);
//     }
//   }
//   return absUrl;
// };

// Map of URL patterns to handlers
// this.urlRules = [];
// Add a rule to handle URL changes
// urlPattern - follows Angular ngRoute pattern rules
// this.addUrlHandler = function(urlPattern: string, rule) {
//   let sections = urlPattern.split('/');
//   // Match path from the beginning
//   let builder = ['^'];
//   let parameters = [];
//   for (let n = 0; n < sections.length; n++) {
//     let section = sections[n];
//     if (section == '') {
//       // Ignore empty section
//     } else if (section[0] == ':') {
//       if (section.substr(-1) == '?') {
//         // Optional parameter capture
//         parameters.push(section.substring(1, section.length - 1));
//         builder.push('(?:\\/([^\\/]+))?');
//       } else {
//         // Parameter capture
//         parameters.push(section.substring(1));
//         builder.push('\\/([^\\/]+)');
//       }
//     } else {
//       // Match name
//       builder.push('\\/' + section);
//     }
//   }
//   // Optional trailing slash, optional query or fragment, match to end of path
//   builder.push('\\/?(?:[\\?\\#].*)?$');
//   rule.urlPattern = new RegExp(builder.join(''));
//   rule.parameters = parameters;
//   that.urlRules.push(rule);
// };

// Construct a part of the URL with id and alias if id!=alias, otherwise just id
const getBaseUrl = function(base: string, id: string, alias: string): string {
  return '/' + base + '/' + id + (alias === id ? '' : '/' + alias) + '/';
};

// Return the top level domain.
const getTopLevelDomain = function(withHttpPrefix: boolean): string {
  if (isLive()) {
    let domain = 'arbital.com';
    if (withHttpPrefix) return 'https://' + domain;
    return domain;
  }
  let domain = 'localhost:3000';
  if (withHttpPrefix) return 'http://' + domain;
  return domain;
};

// Get a domain url (with optional subdomain)
const getDomainUrl = function(subdomain?: string): string {
  if (subdomain === undefined) {
    // Use current domain
    return getCurrentDomainUrl();
  }
  if (subdomain !== '') subdomain += '.';
  subdomain = subdomain.toLowerCase();
  if (isLive()) {
    return 'https://' + subdomain + getTopLevelDomain(false);
  }
  return 'http://' + subdomain + getTopLevelDomain(false);
};

const getCurrentDomainUrl = function(): string {
  // TODO: figure out whether this converter was ever intended to work on the backend.  My guess: no.
  // return window.location.origin;
  return 'http://localhost:3000';
};

// Make sure the URL path is in the given canonical form, otherwise silently change
// the URL, preserving the search() params.
// this.ensureCanonPath = function(canonPath: string) {
//   let hash = $location.hash();
//   let search = $location.search();
//   this.goToUrl(canonPath, {replace: true});
//   $location.hash(hash);
//   for (let k in search) {
//     $location.search(k, search[k]);
//   }
// };

// Go to the given url. If there is a domain switch, we refresh the page.
interface goToUrlOptions {
  // If true, replace the current page in browser history with this one
  replace?: boolean,
  // If set, we'll check to see if the user ctrl+clicked to open a new tab
  event?: MouseEvent,
};
// this.goToUrl = function(url: string, options: goToUrlOptions) {
//   options = options || {};

//   let differentHost = false;
//   if (url.indexOf('http') === 0) {
//     let domainUrl = this.getCurrentDomainUrl();
//     if (url.indexOf(domainUrl) !== 0) {
//       differentHost = true;
//     } else {
//       url = url.slice(domainUrl.length);
//     }
//   }

//   if (options.event && (options.event.ctrlKey || options.event.metaKey)) {
//     window.open(url, '_blank');
//   } else if (differentHost) {
//     window.location.href = url;
//   } else {
//     if (options.replace) $location.replace();
//     $location.url(url);
//   }
// };

// Returns the url for the given page.
interface getPageUrlOptions {
  // If true, we'll include page's id, otherwise, we'll use alias
  permalink?: boolean,
  // If true, use edit map to retrieve info for this page
  useEditMap?: boolean,
  // If true, don't add the host part of the URL
  noHost?: boolean,
  // If true, jump to the answers part of the page
  answersHash?: boolean,
  // If set, select the given lens
  lensId?: string,
  // If set, select the given mark on the page
  markId?: string,
  // If set, the user is on the given path
  pathInstanceId?: string,
  // If set, this page determines what arc the user is on
  pathPageId?: string,
  // If set, the user is doing an arc starting from this hub page
  hubId?: string,
  // If true, jump to the discussion part of the page
  discussionHash?: boolean,
  // If true, immediately start the path if the current page is an arc
  startPath?: boolean,
};
export const getPageUrl = function(pageId: string, options: getPageUrlOptions, pageMap: Record<string, PageInfosRow>, domainMap: Record<string, DomainsRow>): string {
  options = options || {};
  let url = '/p/' + pageId + '/';
  // TODO: implement this and remove the pageMap parameter
  // let page = stateService.getPageFromSomeMap(pageId, options.useEditMap);
  let page = pageMap[pageId];

  if (page) {
    let pageAlias = page.alias;
    // Make sure the page's alias is scoped to its group
    if (isIntIdValid(page.seeDomainId) && page.pageId !== page.alias) {
      let domainAlias = domainMap[page.seeDomainId].alias;
      if (pageAlias.indexOf('.') === -1) {
        pageAlias = domainAlias + '.' + pageAlias;
      }
    }

    url = getBaseUrl('p', options.permalink ? pageId : pageAlias, pageAlias);
    if (options.permalink) {
      url += '?l=' + pageId;
    } else if (options.lensId) {
      url += '?l=' + options.lensId;
    }

    // TODO: figure out if we need to implement this
    // Check page's type to see if we need a special url
    // if (page.isComment()) {
    //   let parent = page.getCommentParentPage();
    //   if (parent) {
    //     url = getPageUrl(parent.pageId, {
    //       permalink: options.permalink,
    //       noHost: true,
    //     });
    //     url += '#subpage-' + pageId;
    //   }
    // }
  }

  // Add markId argument
  if (options.markId) {
    url += url.indexOf('?') < 0 ? '?' : '&';
    url += 'markId=' + options.markId;
  }

  if (options.pathInstanceId) {
    url += url.indexOf('?') < 0 ? '?' : '&';
    url += 'pathId=' + options.pathInstanceId;
  }

  if (options.pathPageId) {
    url += url.indexOf('?') < 0 ? '?' : '&';
    url += 'pathPageId=' + options.pathPageId;
  }

  if (options.hubId) {
    url += url.indexOf('?') < 0 ? '?' : '&';
    url += 'hubId=' + options.hubId;
  }

  if (options.startPath) {
    url += url.indexOf('?') < 0 ? '?' : '&';
    url += 'startPath';
  }

  if (url.indexOf('#') < 0) {
    if (options.discussionHash) {
      url += '#discussion';
    } else if (options.answersHash) {
      url += '#answers';
    }
  }
  let urlAlreadyHasDomain = url.length > 4 && url.substring(0,4) === 'http';
  if (!urlAlreadyHasDomain && !options.noHost) {
    if (page && isIntIdValid(page.seeDomainId)) {
      url = getDomainUrl(domainMap[page.seeDomainId].alias) + url;
    } else {
      url = getDomainUrl() + url;
    }
  }
  return url;
};

// Get url to edit the given page.
interface getEditPageUrlOptions {
  // If set, resolve the given mark when publishing the page and show it
  markId?: string,
  // If set, this will provide a quick option for adding the parent in editor
  parentId?: string,
  // If set, this will set the initially visible tab
  tabId?: string,
};
// this.getEditPageUrl = function(pageId: string, options: getEditPageUrlOptions): string {
//   options = options || {};
//   if (pageId) {
//     pageId = pageId.replace(/[-+]/g, '');
//   }
//   let url = '';
//   let page = stateService.pageMap[pageId];
//   if (page) {
//     url = that.getBaseUrl('edit', pageId, page.alias);
//   } else if (pageId) {
//     url = '/edit/' + pageId + '/';
//   } else {
//     url = '/edit/';
//   }
//   // Add markId argument
//   if (options.markId) {
//     url += url.indexOf('?') < 0 ? '?' : '&';
//     url += 'markId=' + options.markId;
//   }
//   if (options.parentId) {
//     url += url.indexOf('?') < 0 ? '?' : '&';
//     url += 'parentId=' + options.parentId;
//   }
//   if (options.tabId) {
//     url += url.indexOf('?') < 0 ? '?' : '&';
//     url += 'tab=' + options.tabId;
//   }
//   url = that.getDomainUrl() + url;
//   return url;
// };

// Get url to create a new page.
interface getNewPageUrlOptions {
  // If set, there will be a quick option to add this page as a parent
  parentId?: string;
  // If set, the new page will start out with "new claim" settings under this domain id
  newClaimDomainId?: string;
  // If set, the new page will be submitted to this domain feed when it's published
  submitToDomainId?: string;
};
// this.getNewPageUrl = function(options: getNewPageUrlOptions): string {
//   options = options || {};
//   let url = '/edit/';
//   if (options.parentId) {
//     url += url.indexOf('?') < 0 ? '?' : '&';
//     url += 'parentId=' + options.parentId;
//   }
//   if (options.newClaimDomainId) {
//     url += url.indexOf('?') < 0 ? '?' : '&';
//     url += 'newClaimDomainId=' + options.newClaimDomainId;
//   }
//   if (options.submitToDomainId) {
//     url += url.indexOf('?') < 0 ? '?' : '&';
//     url += 'submitToDomainId=' + options.submitToDomainId;
//   }
//   url = that.getDomainUrl() + url;
//   return url;
// };

// Get url for one of the pages suggested by a HUB page.
// interface getHubSuggestionPageUrlOptions {
//   // Id of the hub page
//   hubId: string;
// };
// this.getHubSuggestionPageUrl = function(pageId: string, options: getHubSuggestionPageUrlOptions): string {
//   let goToPageId = pageId;
//   let urlOptions = {
//     hubId: options.hubId,
//     pathPageId: undefined,
//   };
//   let page = stateService.pageMap[pageId];
//   if (page.pathPages.length > 0) {
//     // For paths, we will go to the first path page
//     goToPageId = page.pathPages[0].pathPageId;
//     urlOptions.pathPageId = pageId;
//   }
//   return that.getPageUrl(goToPageId, urlOptions);
// };

// // Get url for exploring the given page's children.
// this.getExplorePageUrl = function(pageId: string): string {
//   return '/explore/' + pageId;
// };
