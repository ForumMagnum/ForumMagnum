import { Posts } from 'meteor/example-forum';

/**
 * @summary Base parameters that will be common to all other view unless specific properties are overwritten
 */
Posts.addDefaultView(terms => ({
  selector: {
    status: Posts.config.STATUS_APPROVED,
    draft: {$ne: true},
    isFuture: {$ne: true}, // match both false and undefined
    unlisted: {$ne: true},
    frontpage: true,
    ...(terms.userId ? {userId: terms.userId} : {}),
    meta: {$ne: true},
  }
}));

/**
 * @summary Draft view
 */
Posts.addView("drafts", terms => {
  return {
    selector: {
      userId: terms.userId,
      draft: true,
      frontpage: {$ne: true},
    },
    options: {
      sort: {createdAt: -1}
    }
}});

/**
 * @summary All drafts view
 */
Posts.addView("all_drafts", terms => ({
  selector: {
    draft: true
  },
  options: {
    sort: {createdAt: -1}
  }
}));

Posts.addView("featured", terms => ({
  options: {
    limit: terms.limit || 3,
    sort: {
      featuredPriority: -1,
    }
  }
}))

Posts.addView("meta", terms => ({
  selector: {
    meta: true,
  },
  options: {
    sort: {
      score: -1,
    }
  }
}))

Posts.addView("metaFeatured", terms => ({
  selector: {
    meta: true,
  },
  options: {
    limit: terms.limit || 3,
    sort: {
      featuredPriority: -1,
      score: -1,
    }
  }
}))
