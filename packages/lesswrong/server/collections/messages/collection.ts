import schema from '@/lib/collections/messages/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { messageVotingOptions } from '@/lib/collections/messages/voting';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';


export const Messages = createCollection({
  collectionName: 'Messages',
  typeName: 'Message',
  schema,
  voteable: messageVotingOptions,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('Messages', { conversationId:1, createdAt:1 });
    return indexSet;
  },
  // Don't log things related to Messages to LWEvents, to keep LWEvents relatively
  // free of confidential stuff that admins shouldn't look at.
});

export default Messages;
