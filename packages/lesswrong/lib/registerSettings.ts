import {registerSetting} from './vulcan-lib'

registerSetting('forumType', 'LessWrong', 'What type of Forum is being run, {LessWrong, AlignmentForum, EAForum}')

registerSetting('hasEvents', true, 'Does this version have local events')

// HeadTags
registerSetting('logoUrl', null, 'Absolute URL for the logo image');
registerSetting('title', 'My App', 'App title');
registerSetting('tagline', null, 'App tagline');
registerSetting('description', null);
registerSetting('siteImage', null, 'An image used to represent the site on social media');
registerSetting('faviconUrl', '/img/favicon.ico', 'Favicon absolute URL');

registerSetting('forum.numberOfDays', 10, 'Number of days to display in the timeframe view');
registerSetting('forum.numberOfWeeks', 4, 'Number of weeks to display in the timeframe view');
registerSetting('forum.numberOfMonths', 4, 'Number of months to display in the timeframe view');
registerSetting('forum.numberOfYears', 4, 'Number of days to display in the timeframe view');

// Karma
registerSetting('timeDecayFactor', 1.15, 'Used to discount sorting score with time');

// Comments callbacks
registerSetting('forum.commentInterval', 15, 'How long users should wait in between comments (in seconds)');

// helpers.js
registerSetting('forum.outsideLinksPointTo', 'link', 'Whether to point RSS links to the linked URL (“link”) or back to the post page (“page”)');
registerSetting('forum.requirePostsApproval', false, 'Require posts to be approved manually');
registerSetting('twitterAccount', null, 'Twitter account associated with the app');
registerSetting('siteUrl', null, 'Main site URL');
registerSetting('siteNameWithArticle', 'LessWrong', 'Your site name may be referred to as "The Alignment Forum" or simply "LessWrong". Use this setting to prevent something like "view on Alignment Forum". Leave the article uncapitalized ("the Alignment Forum") and capitalize if necessary.')

// posts/callbacks/other.js
registerSetting('forum.trackClickEvents', true, 'Track clicks to posts pages');

// posts/callbacks/validation.js
registerSetting('forum.postInterval', 30, 'How long users should wait between each posts, in seconds');
registerSetting('forum.maxPostsPerDay', 5, 'Maximum number of posts a user can create in a day');

// robots.js
registerSetting('disallowCrawlers', false, 'Whether to serve a robots.txt that asks crawlers not to index');

// Google Analytics + Tag Manager
registerSetting('googleAnalytics.apiKey', null, 'Google Analytics ID');
registerSetting('googleTagManager.apiKey', null, 'Google Tag Manager ID');

// Sentry
registerSetting('sentry.url', null, 'Sentry DSN URL')
registerSetting('sentry.environment', null, 'Sentry environment ie: development')
registerSetting('sentry.release', null, 'Sentry release')

// ReCaptcha ApiKey
registerSetting('reCaptcha.apiKey', null, 'ReCaptcha API Key')
registerSetting('reCaptcha.secret', null, 'ReCaptcha Secret')

// Akismet
registerSetting('akismet.apiKey', null, 'Akismet API Key')
registerSetting('akismet.url', null, 'Akismet url as entered into their site')

// Spam strictness settings
registerSetting('requireReCaptcha', false, 'Users must come with recaptcha scores to be reviewed')
registerSetting('hideUnreviewedAuthorComments', false, 'Hide comments by unreviewed authors (prevents spam, but delays new user engagement)')

// LogRocket settings
registerSetting('logRocket.apiKey', null, 'LogRocket API Key')
registerSetting('logRocket.sampleDensity', 5, 'Tracking 1 of n users (1 means all users are tracked)')

// CKEditor settings
registerSetting('ckEditor.environmentId', null, 'Environment Id for CKEditor collaboration features')
registerSetting('ckEditor.secretKey', null, 'Secret Key for CKEditor collaboration features')
registerSetting('ckEditor.webSocketUrl', null, 'Web socket Url for CKEditor collaboration features')
registerSetting('ckEditor.uploadUrl', null, 'Upload URL for CKEditor image upload')

// Mapbox API Key
registerSetting('mapbox.apiKey', null, 'API Key for the mapbox map and tile requests')

// Post/Sequence IDs
registerSetting('aboutPostId', 'bJ2haLkcGeLtTWaD5', 'Post ID for the /about route') // Currently unused by LW/AF
registerSetting('introPostId', null, 'Post ID for the /intro route')
registerSetting('eaHomeSequenceId', null, 'Sequence ID for the EAHomeHandbook sequence')
registerSetting('eaHomeSequenceFirstPostId', null, 'Post ID for the first post in the EAHomeHandbook Sequence')

// Custom analytics
registerSetting('analytics.connectionString', null, 'Postgres connection string to the analytics database');
registerSetting('analytics.environment', 'misconfigured', 'Environment being used to view the site');
