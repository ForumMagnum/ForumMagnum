import { Posts } from 'meteor/example-forum';

Posts._ensureIndex({'slug': 1});
Posts._ensureIndex({'curatedDate': 1});
Posts._ensureIndex({'frontpageDate': 1});
