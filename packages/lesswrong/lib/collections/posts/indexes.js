import { Posts } from 'meteor/example-forum';

// Top Posts query index
Posts._ensureIndex({'slug': 1});
