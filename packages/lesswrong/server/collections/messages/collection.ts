import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';


export const Messages: MessagesCollection = createCollection({
  collectionName: 'Messages',
  typeName: 'Message',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('Messages', { conversationId:1, createdAt:1 });
    return indexSet;
  },
  // Don't log things related to Messages to LWEvents, to keep LWEvents relatively
  // free of confidential stuff that admins shouldn't look at.
  logChanges: false,
});

export default Messages;
