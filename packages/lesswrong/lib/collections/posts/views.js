import { Posts } from 'meteor/example-forum';

/**
 * @summary Base parameters that will be common to all other view unless specific properties are overwritten
 */
Posts.addDefaultView(terms => {
  const validFields = _.pick(terms, 'frontpage', 'userId');
  return ({
    selector: {
      status: Posts.config.STATUS_APPROVED,
      draft: {$ne: true},
      isFuture: {$ne: true}, // match both false and undefined
      unlisted: {$ne: true},
      frontpage: true,
      ...validFields,
      meta: {$ne: true},
    }
  });
})


/**
 * @summary User posts view
 */
Posts.addView("userPosts", terms => ({
  selector: {
    userId: terms.userId,
    frontpage: {$ne: true},
  },
  options: {
    limit: 5,
    sort: {
      score: -1,
    }
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
