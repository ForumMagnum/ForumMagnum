import Messages from '../../lib/collections/messages/collection';
import { Vulcan, runCallbacks } from '../vulcan-lib';

Vulcan.runMessagesEditCallbacks = async () => {
  let messageCount = 0;
  // To fetch all posts from a given user:
  // const posts = Posts.find({draft:{$ne:true}, userId:'N9zj5qpTfqmbn9dro'}).fetch()
  // To fetch all posts, starting with most recent:
  const messages = Messages.find({}, {sort:{createdAt:-1}}).fetch()
  //eslint-disable-next-line no-console
  console.log(`Found ${messages.length} messages, triggering Edit Callbacks`)
  for (let message of messages) {
    // @ts-ignore FIXME This should be "contents" (with an 's'). This script is probably mostly broken.
    if (message.content) {
      try {
        // @ts-ignore FIXME contents, not content
        const newMessageFields = await runCallbacks("messages.edit.sync", {$set: {content:message.content}}, message, {isAdmin: false})
        // @ts-ignore FIXME This has too many arguments and I don't know wihat "isAdmin" is supposed to be
        Messages.update(message._id,newMessageFields, message, {isAdmin: false})
      } catch (e) {
        //eslint-disable-next-line no-console
        console.error(e)
      }
    }
    if (messageCount % 1 == 0) {
      //eslint-disable-next-line no-console
      console.log(`${messageCount} messages / ${messages.length}, ${message._id}`);
    }
    messageCount++
  }
}
