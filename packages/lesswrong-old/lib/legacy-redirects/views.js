import { Posts } from 'meteor/example-forum'

Posts.addView("legacyPostUrl", function (terms) {
  return {
    selector: {"legacyData.url": {$regex: "\/lw\/"+terms.legacyUrlId+"\/.*"}},
    options: {limit: 1},
  };
});
