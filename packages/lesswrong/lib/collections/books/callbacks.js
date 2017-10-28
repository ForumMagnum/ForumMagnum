import { addCallback } from 'meteor/vulcan:core';
import { convertFromRaw } from 'draft-js';
import { draftToHTML } from '../../editor/utils.js';
import htmlToText from 'html-to-text';

function BooksNewHTMLSerializeCallback (book) {
  if (book.description) {
    const contentState = convertFromRaw(book.description);
    const html = draftToHTML(contentState);
    book.htmlDescription = html;
    book.plaintextDescription = contentState.getPlainText();
  }
  return book
}

addCallback("books.new.sync", BooksNewHTMLSerializeCallback);

function BooksEditHTMLSerializeCallback (modifier, book) {
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

addCallback("books.edit.sync", BooksEditHTMLSerializeCallback);
