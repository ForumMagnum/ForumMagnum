import '../../server/server.js';
import './test-metatest.js';
import './test-voting.js';
import './test-debouncer.js';

// Component helper tests
// These aren't strictly speaking server tests, but we'd like to test them at
// the same time as the server tests, so we'll include them here
import './test-commentsItem.js';
import './test-timeframeUtils.js';

import './moderation/test-moderationServer.js';
import './moderation/test-moderationFrontend.js';

import './test-comments.js';
import './test-posts.js';
import './test-users.js';
import './test-notifications.js';

import './test-postsAf.js';
import './test-usersAf.js';

import './test-email.jsx';
import './test-editorUtils.js';

import './test-searchUtils.js';

