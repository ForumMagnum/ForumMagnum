import { addCallback } from 'meteor/vulcan:core';
import { convertFromRaw } from 'draft-js';
import { draftToHTML } from '../../editor/utils.js';
import htmlToText from 'html-to-text';

function SequencesNewHTMLSerializeCallback (sequence) {
  if (sequence.description) {
    const contentState = convertFromRaw(sequence.description);
    const html = draftToHTML(contentState);
    sequence.htmlDescription = html;
    sequence.plaintextDescription = contentState.getPlainText();
  }
  return sequence
}

addCallback("sequences.new.sync", SequencesNewHTMLSerializeCallback);

function SequencesEditHTMLSerializeCallback (modifier, sequence) {
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

addCallback("sequences.edit.sync", SequencesEditHTMLSerializeCallback);
