import {registerSetting} from './vulcan-lib'

registerSetting('forumType', 'LessWrong', 'What type of Forum is being run, {LessWrong, AlignmentForum, EAForum}')

registerSetting('hasEvents', true, 'Does this version have local events')

// HeadTags
registerSetting('title', 'My App', 'App title');
registerSetting('description', null);
registerSetting('siteImage', null, 'An image used to represent the site on social media');

// Karma
registerSetting('timeDecayFactor', 1.15, 'Used to discount sorting score with time');

// helpers.js
registerSetting('forum.outsideLinksPointTo', 'link', 'Whether to point RSS links to the linked URL (“link”) or back to the post page (“page”)');
registerSetting('forum.requirePostsApproval', false, 'Require posts to be approved manually');
registerSetting('twitterAccount', null, 'Twitter account associated with the app');
registerSetting('siteUrl', null, 'Main site URL');
registerSetting('siteNameWithArticle', 'LessWrong', 'Your site name may be referred to as "The Alignment Forum" or simply "LessWrong". Use this setting to prevent something like "view on Alignment Forum". Leave the article uncapitalized ("the Alignment Forum") and capitalize if necessary.')

// posts/callbacks/other.js
registerSetting('forum.trackClickEvents', true, 'Track clicks to posts pages');

// robots.js
registerSetting('disallowCrawlers', false, 'Whether to serve a robots.txt that asks crawlers not to index');

// ReCaptcha ApiKey
registerSetting('reCaptcha.secret', null, 'ReCaptcha Secret')

// Spam strictness settings
registerSetting('requireReCaptcha', false, 'Users must come with recaptcha scores to be reviewed')

// LogRocket settings
registerSetting('logRocket.apiKey', null, 'LogRocket API Key')
registerSetting('logRocket.sampleDensity', 5, 'Tracking 1 of n users (1 means all users are tracked)')

// CKEditor settings
registerSetting('ckEditor.environmentId', null, 'Environment Id for CKEditor collaboration features')
registerSetting('ckEditor.secretKey', null, 'Secret Key for CKEditor collaboration features')
registerSetting('ckEditor.webSocketUrl', null, 'Web socket Url for CKEditor collaboration features')
registerSetting('ckEditor.uploadUrl', null, 'Upload URL for CKEditor image upload')

// Post/Sequence IDs
registerSetting('introPostId', null, 'Post ID for the /intro route')

// Custom analytics
registerSetting('analytics.connectionString', null, 'Postgres connection string to the analytics database');
registerSetting('analytics.environment', 'misconfigured', 'Environment being used to view the site');
