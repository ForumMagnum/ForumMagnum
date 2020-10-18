import './metatest.tests';
import './voting.tests';
import './debouncer.tests';
import './diff.tests';

// Component helper tests
// These aren't strictly speaking server tests, but we'd like to test them at
// the same time as the server tests, so we'll include them here
import '../components/comments/CommentsItem/_comments-unit-tests';
import '../components/posts/timeframeUtils.tests';

import './moderation/moderation.server.tests';
import './moderation/moderation.frontend.tests';

import '../lib/collections/comments/tests';
import '../lib/collections/posts/tests';
import '../lib/collections/users/tests';
import '../lib/collections/notifications/tests';

import '../lib/alignment-forum/posts/tests';
import '../lib/alignment-forum/users/tests';

import '../server/emails/tests';
import '../lib/editor/utils.test';

import '../server/search/utils.tests';

import './components.tests.ts';
