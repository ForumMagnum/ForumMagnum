/*

### How to use this file ###

You can add and remove imports based on the features you need. 

Make sure to remove the equivalent import (i.e. nova-rss and nova-rss-server)
in server.js as well. 

Note that imports loaded by *other* imports are not listed here. For example, 
nova-posts is used by nova-base-components so it'll be imported even though
it doesn't appear in this file. 

### i18n

To add/remove/change languages, modify the i18n import. 

### Customization

You can also add your own imports here to customize your app. For example:

import '../packages/my-custom-package/lib/export.js';

*/

// i18n

import '../packages/nova-i18n-en-us/lib/export.js';

// features packages

import 'nova-rss';
import 'nova-notifications';
import 'nova-search';
import 'nova-voting';
import 'nova-newsletter';
import 'nova-subscribe';
import 'nova-debug';
import 'nova-getting-started';

// base packages

import 'nova-base-components';
import 'nova-base-styles';
import 'nova-base-routes';