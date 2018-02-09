function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

sleep(15000);

import '../lib/collections/comments/tests.js';
import '../lib/collections/posts/tests.js';
import '../lib/collections/notifications/tests.js';
import './metatest.tests.js';
import './moderation/moderation.server.tests.js';
import './voting.tests.js';

import '../components/comments/CommentsItem/_comments-unit-tests.js';
import './moderation/moderation.client.tests.js';
