/* eslint-disable no-useless-escape */
/* eslint-disable eqeqeq */
/* eslint-disable no-control-regex */
/* eslint-disable @typescript-eslint/type-annotation-spacing */
// @ts-nocheck

export const escapeHtml = function(s) {
  const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#39;',
    '/': '&#x2F;'
  };
  return String(s).replace(/[&<>"'\/]/g, function(s) {
    return entityMap[s];
  });
};

// TODO: replace the regex with the official URL object once lib.d.ts is updated to a version from after May 2016 (see: https://github.com/Microsoft/TypeScript/issues/2583)
export const anyUrlMatch = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/i;

export const subdomainRegexpStr = '[A-Za-z0-9]+\\.';

// Return a regex that handles all 4 possible cases for subdomains in the URL
export const getHostMatchRegex = function(host) {
  // host can be either arbital.com or pagesubdomain.arbital.com, but we currently don't have a way to tell which from here
  // Also, when testing locally, instead of arbital.com, the url can be either localhost:8012 or a specific IP address
  // We want to match arbital.com and linksubdomain.arbital.com
  // So we need one variable with the host as it is, and one variable with the host with everything up to the first . removed
  let hostWithoutSubdomain = host;
  const periodIndex = hostWithoutSubdomain.indexOf('.');
  if (periodIndex > 0) {
    hostWithoutSubdomain = hostWithoutSubdomain.substring(periodIndex + 1);
  }
  // We will be using these variables as part of the regex, which requires escaping the . and :
  host = host.replace(/\./g, '\\.');
  hostWithoutSubdomain = hostWithoutSubdomain.replace(/\./g, '\\.');
  host = host.replace(/\:/g, '\\:');
  hostWithoutSubdomain = hostWithoutSubdomain.replace(/\:/g, '\\:');

  // Now compile the regex to handle all 4 possible cases
  const regexString = '(?:' +
    '(?:' + host + ')|' + // arbital.com or pagesubdomain.arbital.com
    '(?:' + hostWithoutSubdomain + ')|' + // com or arbital.com
    '(?:' + subdomainRegexpStr + host + ')|' + // linksubdomain.arbital.com or linksubdomain.pagesubdomain.arbital.com
    '(?:' + subdomainRegexpStr + hostWithoutSubdomain + ')' + // linksubdomain.com or linksubdomain.arbital.com
    ')';

  return regexString;
};

// Return true if we are in the live/production environment. (False if it's staging.)
export const isLive = function() {
  return window.location.host.indexOf('arbital.com') >= 0;
};

// TODO: figure out if we need this
// Extend jQuery with a function to change element's type
// (function($) {
//   $.fn.changeElementType = function(newType) {
//     const attrs = {};

//     $.each(this[0].attributes, function(idx, attr) {
//       attrs[attr.nodeName] = attr.nodeValue;
//     });

//     const $newElement = $('<' + newType + '/>', attrs);
//     this.replaceWith(function() {
//       return $newElement.append($(this).contents());
//     });
//     return $newElement;
//   };
// })(jQuery);

// Turn a callback function into a cleverly throttled version.
// Callback parameter should return true if the lock is to be set.
// Basically, we want:
// 1) Instant callback if the delay is met
// 2) Otherwise, wait to call the callback until delay is met
// 3) If we are waiting on the delay, don't stack additional calls
export const createThrottledCallback = function(callback, delay) {
  // waitLock is set when we are waiting on the delay.
  let waitLock = false;
  // Timeout is set when we need to do the callback after the delay
  let timeout = undefined;

  const result = function() {
    if (waitLock) {
      if (!timeout) {
        timeout = window.setTimeout(function() {
          timeout = undefined;
          result();
        }, delay);
      }
      return;
    }
    if (callback()) {
      waitLock = true;
      window.setTimeout(function() {
        waitLock = false;
      }, delay);
    }
  };
  return result;
};

// submitForm handles the common functionality in submitting a form like
// showing/hiding UI elements and doing the AJAX call.
export const submitForm = function($form, url, data, success, error = () => {}) {
  const $errorText = $form.find('.submit-form-error');
  const $successText = $form.find('.submit-form-success');
  const invisibleSubmit = data.__invisibleSubmit;
  if (!invisibleSubmit) {
    $form.find('[toggle-on-submit]').toggle();
  }

  if (!('password' in data)) {
    // eslint-disable-next-line no-console
    console.log('Submitting form to ' + url + ':'); console.log(data);
  }
  $.ajax({
    type: 'POST',
    url: url,
    data: JSON.stringify(data),
  })
  .always(function(r) {
    if (!invisibleSubmit) {
      $form.find('[toggle-on-submit]').toggle();
    }
  }).done(function(r) {
    $errorText.hide();
    $successText.show();
    success(r);
  }).fail(function(r) {
    // Want to show an error even on invisible submit.
    $errorText.show();
    $errorText.text(r.statusText + ': ' + r.responseText);
    $successText.hide();
    // eslint-disable-next-line no-console
    console.error(r);
    error();
  });
};

// Validate email addresses, get rid of whitespace & duplicates.
// emailStr - comma separated list of emails.
// Returns object with array of valid emails and array with invalid emails
export const cleanEmails = function(emailStr) {
  const dirtyArray = emailStr.split(',');
  const cleanedArray = [];
  const invalidEmails = [];
  for (var i = 0; i < dirtyArray.length; i++) {
    const trimmedEmail = dirtyArray[i].trim();
    // If it's a valid email, and not yet in cleanedArray, add.
    if (isValidEmail(trimmedEmail)) {
      if (cleanedArray.indexOf(trimmedEmail) === -1) {
        cleanedArray.push(trimmedEmail);
      }
    } else {
      invalidEmails.push(trimmedEmail);
    };
  }
  return {valid: cleanedArray, invalid: invalidEmails};
};

// Validate email addresses. Based on RFC 2822.
export const isValidEmail = function(email) {
  const re = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
  return re.test(email);
};

// We store int64 ids in strings. Because of that invalid ids can have two values: "" and "0".
// Check if the given int64 id is valid.
export const isIntIdValid = function(id) {
  return id != '' && id != '0';
};

// Return a string which prints one of:
// 1) X1
// 2) X2 and X3
// 3) X1, X2, and # other things
// depending on the number of things in the list.
var formatListForDisplay = function(list, singularThing, pluralThing) {
  if (list.length == 1) {
    return list[0];
  }

  if (list.length == 2) {
    return list[0] + ' and ' + list[1];
  }

  const numExtra = list.length - 2;
  return list[0] + ', ' + list[1] + ', and ' + numExtra + ' other ' +
    ((numExtra == 1) ? singularThing : pluralThing);
};

export const formatUsersForDisplay = function(list) {
  return formatListForDisplay(list, 'person', 'people');
};

export const formatReqsForDisplay = function(list) {
  return formatListForDisplay(list, 'requisite', 'requisites');
};

// export const isTouchDevice = 'ontouchstart' in window || // works in most browsers
//   (navigator.maxTouchPoints > 0) ||
//   (navigator.msMaxTouchPoints > 0);

// Often when we sort lists, we want to sort by multiple parameters. This is a helper function
// that constructs the function you would pass to array.sort().
// Example:
// varsA = [edit, createdAt]
// varsB = [edit, createdAt]
// makeVarsFn should take an object from the array and return corresponding array of vars.
// arraysSortFn will return a function that when passed to array.sort() will sort the array
// by edit and then by createdAt.
export const arraysSortFn = function(makeVarsFn) {
  return function(a, b) {
    const varsA = makeVarsFn(a);
    const varsB = makeVarsFn(b);
    for (var n = 0; n < varsA.length; n++) {
      if (varsA[n] == varsB[n]) continue;
      return varsA[n] < varsB[n] ? -1 : 1;
    }
    return 0;
  };
};
