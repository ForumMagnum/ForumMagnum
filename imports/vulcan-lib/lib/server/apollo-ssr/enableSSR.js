/**
 * Actually enable SSR
 */

import { populateComponentsApp, populateRoutesApp, initializeFragments } from 'vulcan:lib';
// onPageLoad is mostly equivalent to an Express middleware
// excepts it is tailored to handle Meteor server side rendering
import { onPageLoad } from 'meteor/server-render';

import makePageRenderer from './renderPage';

console.log("enableSSR")
const enableSSR = () => {
  // Meteor.startup(() => {
  //   setTimeout(() => {
  //     // init the application components and routes, including components & routes from 3rd-party packages
  //     initializeFragments();
  //     populateComponentsApp();
  //     populateRoutesApp();
  //     // render the page
  //     onPageLoad(makePageRenderer);
  //   }, 500)
  // });
};

export default enableSSR;
