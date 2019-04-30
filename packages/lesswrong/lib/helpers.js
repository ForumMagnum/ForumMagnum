import Messages from './collections/messages/collection.js';
import Conversations from './collections/conversations/collection.js';
import { Utils } from 'meteor/vulcan:core';


/**
* @summary Get relative link to conversation (used only in session)
* @param {Object} conversation
**/
Conversations.getLink = (conversation) => {
  return `/inbox?select=${conversation._id}`;
};

/**
* @summary Get relative link to conversation of message (conversations are only linked to relatively)
* @param {Object} message
**/
Messages.getLink = (message) => {
  return `/inbox?select=${message.conversationId}`;
};


/**
* @summary Navigates user to url, if they did not click on any child link. We need
* this because sometimes we have nested navigation areas, such as SequencesGridItems,
* in which the whole item navigates you to the sequences page when clicked, but it also
* has a link to the author's user page inside of the GridItem. To avoid triggering both
* events we check whether any parent of the clicked element is an a tag.
* @param {Event} event
* @param {String} url
* @param {Function} navigate
**/
Utils.manualClickNavigation = (event, url, navigate) => {
  if (!event.target.closest('a')) { // Checks whether any parent is a tag (polyfilled for IE and Edge)
    navigate(url)
  }
}
