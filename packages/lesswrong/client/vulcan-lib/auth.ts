/**
 * Manage meteor_login_token cookie
 * Necessary for authentication when the
 * Authorization header is not set
 *
 * E.g on first page loading
 */
import Cookies from 'universal-cookie';

import { Meteor } from 'meteor/meteor';
import { onStartup } from '../../lib/executionEnvironment';

const cookie = new Cookies();

function setToken(loginToken: string|null, expires: Date|-1) {
  if (loginToken && expires !== -1) {
    cookie.set('meteor_login_token', loginToken, {
      path: '/',
      expires,
    });
  } else {
    cookie.remove('meteor_login_token', {
      path: '/',
    });
  }
}

function initToken() {
  let loginToken, loginTokenExpires;
  try {
    // Get Meteor.loginToken from localStorage. This is wrapped in a try-catch
    // because some browsers (especially mobile browsers) don't have
    // localStorage, and throw a wide variety of Sentry-polluting errors here.
    loginToken = (global as any).localStorage['Meteor.loginToken'];
    loginTokenExpires = new Date((global as any).localStorage['Meteor.loginTokenExpires']);
  } catch(e) {
    return;
  }

  if (loginToken) {
    setToken(loginToken, loginTokenExpires);
  } else {
    setToken(null, -1);
  }
}

onStartup(() => {
  initToken();
});

// TODO: cleanup
// This part of the code overrides the default localStorage function,
// so that when Meteor.loginToken is set, it is also automatically
// stored as a cookie (necessary for SSR to work as expected for all HTTP requests)
const originalSetItem = Meteor._localStorage.setItem;
Meteor._localStorage.setItem = function setItem(key: string, value: string) {
  if (key === 'Meteor.loginToken') {
    Meteor.defer(initToken);
  }
  originalSetItem.call(Meteor._localStorage, key, value);
};
const originalRemoveItem = Meteor._localStorage.removeItem;
Meteor._localStorage.removeItem = function removeItem(key: string) {
  if (key === 'Meteor.loginToken') {
    Meteor.defer(initToken);
  }
  originalRemoveItem.call(Meteor._localStorage, key);
};
