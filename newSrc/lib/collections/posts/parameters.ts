import moment from 'moment';
import { addCallback } from '../../vulcan-lib';
import * as _ from 'underscore';

// Add 'after' and 'before' properties to terms which can be used to limit posts in time.
function PostsAddBeforeAfterParameters (parameters, terms, apolloClient) {
  if (!parameters.selector.postedAt) {
    let postedAt: any = {};

    if (terms.after) {
      postedAt.$gt = moment(terms.after).toDate();
    }
    if (terms.before) {
      postedAt.$lt = moment(terms.before).toDate();
    }

    if (!_.isEmpty(postedAt) && !terms.timeField) {
      parameters.selector.postedAt = postedAt;
    } else if (!_.isEmpty(postedAt)) {
      parameters.selector[terms.timeField] = postedAt;
    }
  }

  return parameters;
}
addCallback('posts.parameters', PostsAddBeforeAfterParameters);
