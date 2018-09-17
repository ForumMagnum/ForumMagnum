import { Posts } from 'meteor/example-forum';

Posts._ensureIndex({'slug': 1});
Posts._ensureIndex({'curatedDate': 1});
Posts._ensureIndex({'frontpageDate': 1});
Posts._ensureIndex({ mongoLocation : "2dsphere" });

// Indexes from example-forum
Posts._ensureIndex({'categories': 1});
Posts._ensureIndex({"status": 1, "isFuture": 1});
Posts._ensureIndex({"status": 1, "isFuture": 1, "postedAt": 1});
