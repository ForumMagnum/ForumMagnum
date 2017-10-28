import { addCallback } from 'meteor/vulcan:core';
import { convertFromRaw } from 'draft-js';
import { draftToHTML } from '../../editor/utils.js';
import htmlToText from 'html-to-text';

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
