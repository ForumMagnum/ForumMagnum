import { addCallback } from 'meteor/vulcan:core';
import { convertFromRaw } from 'draft-js';
import { draftToHTML } from '../../editor/utils.js';
import htmlToText from 'html-to-text';
import { Posts } from '../posts/index.js';
import Sequences from '../sequences/collection.js';

function ChaptersNewHTMLSerializeCallback (chapter) {
  if (chapter.description) {
    const contentState = convertFromRaw(chapter.description);
    const html = draftToHTML(contentState);
    chapter.htmlDescription = html;
    chapter.plaintextDescription = contentState.getPlainText();
  }
  return chapter
}

addCallback("chapters.new.sync", ChaptersNewHTMLSerializeCallback);

function ChaptersEditHTMLSerializeCallback (modifier, chapter) {
  if (modifier.$set && modifier.$set.description) {
    const contentState = convertFromRaw(modifier.$set.description);
    modifier.$set.htmlDescription = draftToHTML(contentState);
    modifier.$set.plaintextDescription = contentState.getPlainText();
  } else if (modifier.$set && modifier.$set.htmlDescription) {
    modifier.$set.plaintextDescription = htmlToText.fromString(modifier.$set.htmlDescription);
  } else if (modifier.$unset && modifier.$unset.description) {
    modifier.$unset.htmlDescription = true;
    modifier.$unset.plaintextDescription = true;
  }
  return modifier
}

addCallback("chapters.edit.sync", ChaptersEditHTMLSerializeCallback);

async function ChaptersEditCanonizeCallback (chapter) {
  const posts = await Sequences.getAllPosts(chapter.sequenceId)
  const sequence = await Sequences.findOne({_id:chapter.sequenceId})

  posts.forEach((currentPost, i) => {

    const validSequenceId = (currentPost, sequence) => {
      // Only update a post if it either doesn't have a canonicalSequence, or if we're editing
      // chapters *from* its canonicalSequence
      return !currentPost.canonicalSequenceId || currentPost.canonicalSequenceId === sequence._id
    }

    if ((currentPost.userId === sequence.userId) && validSequenceId(currentPost, sequence)) {
      let prevPost = {slug:""}
      let nextPost = {slug:""}
      if (i-1>=0) {
        prevPost = posts[i-1]
      }
      if (i+1<posts.length) {
        nextPost = posts[i+1]
      }
      Posts.update({slug: currentPost.slug}, {$set: {
        canonicalPrevPostSlug: prevPost.slug,
        canonicalNextPostSlug: nextPost.slug,
        canonicalSequenceId: chapter.sequenceId,
      }});
    }
  })
  return chapter
}

addCallback("chapters.new.async", ChaptersEditCanonizeCallback);
addCallback("chapters.edit.async", ChaptersEditCanonizeCallback);
