import Posts from '../../lib/collections/posts/collection';
import { parseDocumentFromString } from '../../lib/domParser';
import { extractTableOfContents as extractTableOfContentsNew } from '../../lib/tableOfContents';
import { extractTableOfContents as extractTableOfContentsOld } from '../tableOfContentsOld';
import { Globals } from '../vulcan-lib';

const regressions = [
  `<p><i><strong>Bold and italic</strong></i></p>`,
  // Note: both the old and new versions got this one wrong (this should all be one header). Imo the new version is more correct though
  `<p><strong>Here is some additional content (</strong><a href=\"https://www.youtube.com/watch?v=S7Cu59G1aSQ&amp;t=76s\"><strong>11 min video</strong></a><strong>) to consider about if you are the right fit for founding.</strong></p>`
]

function testHtml(html: string) {
  const oldToC = extractTableOfContentsOld(html);
  const newToC = extractTableOfContentsNew(parseDocumentFromString(html));

  if (newToC?.html !== oldToC?.html) {
    throw new Error("html doesn't match");
  }

  if (newToC?.sections.length !== oldToC?.sections.length) {
    throw new Error("section length doesn't match");
  }

  for (let i = 0; i < (newToC?.sections.length ?? 0); i++) {
    const oldSection = oldToC?.sections[i];
    const newSection = newToC?.sections[i];

    if (!oldSection || !newSection) {
      throw new Error(`Section doesn't exist`);
    }

    if (oldSection.title !== newSection.title) {
      throw new Error(`Title doesn't match for section ${i}`);
    }
    if (oldSection.answer !== newSection.answer) {
      throw new Error(`Answer doesn't match for section ${i}`);
    }
    if (oldSection.anchor !== newSection.anchor) {
      throw new Error(`Anchor doesn't match for section ${i}`);
    }
    if (oldSection.level !== newSection.level) {
      throw new Error(`Level doesn't match for section ${i}`);
    }
    if (oldSection.divider !== newSection.divider) {
      throw new Error(`Divider doesn't match for section ${i}`);
    }
    if (oldSection.offset !== newSection.offset) {
      throw new Error(`Offset doesn't match for section ${i}`);
    }
  }
}

async function testToC({postId, commentId}: {postId?: string, commentId?: string}) {
  for (const html of regressions) {
    testHtml(html)
  }

  let posts = await Posts.find({_id: postId}, {limit: 100, sort: {createdAt: -1}}).fetch()

  while (posts.length) {
    for (const html of posts.map(p => p.contents?.html)) {
      testHtml(html)
    }

    const lastCreatedAt = posts[posts.length - 1].createdAt;
    posts = await Posts.find({_id: postId, createdAt: {$lt: lastCreatedAt}}, {limit: 100, sort: {createdAt: -1}}).fetch()
  }
}

Globals.testToC = testToC
