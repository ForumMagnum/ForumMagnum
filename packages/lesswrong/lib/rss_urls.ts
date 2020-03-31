import { getSetting } from './vulcan-lib';
import { Meteor } from 'meteor/meteor';

export const rssTermsToUrl = (terms) => {
  const siteUrl = getSetting('siteUrl', Meteor.absoluteUrl());
  const terms_as_GET_params = Object.keys(terms).map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(terms[k])).join('&')
  return siteUrl+"feed.xml?"+terms_as_GET_params;
}
