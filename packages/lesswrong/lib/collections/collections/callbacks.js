import { addCallback } from 'meteor/vulcan:core';
import { convertFromRaw } from 'draft-js';
import { draftToHTML } from '../../editor/utils.js';
import htmlToText from 'html-to-text';

function CollectionsNewHTMLSerializeCallback (collection) {
  if (collection.description) {
    const contentState = convertFromRaw(collection.description);
    const html = draftToHTML(contentState);
    collection.htmlDescription = html;
    collection.plaintextDescription = contentState.getPlainText();
  }
  return collection
}

addCallback("collections.new.sync", CollectionsNewHTMLSerializeCallback);

function CollectionsEditHTMLSerializeCallback (modifier, collection) {
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

addCallback("collections.edit.sync", CollectionsEditHTMLSerializeCallback);
