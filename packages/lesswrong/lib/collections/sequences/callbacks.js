import { addCallback } from 'meteor/vulcan:core';
import { convertFromRaw } from 'draft-js';
import { draftToHTML } from '../../editor/utils.js';
import htmlToText from 'html-to-text';
import Chapters from '../chapters/collection.js'
import Sequences from './collection.js'
import Users from "meteor/vulcan:users";

function SequenceNewCreateChapter (sequence) {
  if (sequence._id && !sequence.chaptersDummy) {
    Chapters.insert({sequenceId:sequence._id})
  }
}

addCallback("sequences.new.async", SequenceNewCreateChapter);

function UpdateUserSequenceCount (sequence) {
  if (sequence.userId) {
    const sequences = Sequences.find({
      userId: sequence.userId,
      draft: {$ne: true},
      isDeleted: {$ne: true}
    }).fetch()
    const drafts = Sequences.find({
      userId: sequence.userId,
      draft: true,
      isDeleted: {$ne: true}
    }).fetch()
    Users.update(sequence.userId, {$set: {
      'sequenceCount':sequences.length,
      'sequenceDraftCount': drafts.length
    }})
  }
}
addCallback("sequences.new.async", UpdateUserSequenceCount);
addCallback("sequences.edit.async", UpdateUserSequenceCount);

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
