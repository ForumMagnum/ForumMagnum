import schema from '@/lib/collections/iframeWidgetSrcdocs/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const IframeWidgetSrcdocs: IframeWidgetSrcdocsCollection = createCollection({
  collectionName: 'IframeWidgetSrcdocs',
  typeName: 'IframeWidgetSrcdoc',
  schema,

  // This is where you can add indexes for the collection.
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('IframeWidgetSrcdocs', { revisionId: 1 });
    return indexSet;
  },
});


export default IframeWidgetSrcdocs;
