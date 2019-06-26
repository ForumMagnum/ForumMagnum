import './metatest.tests.js';
import './voting.tests.js';
import './debouncer.tests.js';

// Component helper tests
// These aren't strictly speaking server tests, but we'd like to test them at
// the same time as the server tests, so we'll include them here
import '../components/comments/CommentsItem/_comments-unit-tests.js';
import '../components/posts/timeframeUtils.tests.js';

import './moderation/moderation.server.tests.js';
import './moderation/moderation.frontend.tests.js';

import '../lib/collections/comments/tests.js';
import '../lib/collections/posts/tests.js';
import '../lib/collections/users/tests.js';
import '../lib/collections/notifications/tests.js';

import '../lib/modules/alignment-forum/posts/tests.js';
import '../lib/modules/alignment-forum/users/tests.js';

import '../server/emails/tests.jsx';
import '../lib/editor/utils.test.js';
