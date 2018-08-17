import { Comments, Posts } from 'meteor/example-forum';
import { Votes } from "meteor/vulcan:voting";


// Recent Comments query index\
Comments._ensureIndex({'postedAt': -1, '_id': -1});

// Top Posts query index
Posts._ensureIndex({'status': -1, 'draft': -1, 'isFuture': -1, 'sticky': -1, 'score': -1, '_id': -1});

// Votes by document (comment) ID
Votes._ensureIndex({ "documentId": 1 });
