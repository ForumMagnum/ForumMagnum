import { Posts } from 'meteor/example-forum';
import Users from 'meteor/vulcan:users';

/**
 * @summary Base parameters that will be common to all other view unless specific properties are overwritten
 */
Posts.addDefaultView(terms => {
  const validFields = _.pick(terms, 'frontpage', 'userId', 'meta');
  return ({
    selector: {
      status: Posts.config.STATUS_APPROVED,
      draft: {$ne: true},
      isFuture: {$ne: true}, // match both false and undefined
      unlisted: {$ne: true},
      meta: {$ne: true},
      ...validFields,
    }
  });
})


/**
 * @summary User posts view
 */
Posts.addView("userPosts", terms => ({
  selector: {
    userId: terms.userId,
  },
  options: {
    limit: 5,
    sort: {
      score: -1,
    }
  }
}));

/**
 * @summary Top view
 */
Posts.addView("top", terms => ({
  options: {
    sort: {sticky: -1, score: -1}
  }
}));

/**
 * @summary New view
 */
Posts.addView("new", terms => ({
  options: {
    sort: {sticky: -1, postedAt: -1}
  }
}));

/**
 * @summary Best view
 */
Posts.addView("best", terms => ({
  options: {
    sort: {sticky: -1, baseScore: -1},
  }
}));

/**
 * @summary Pending view
 */
Posts.addView("pending", terms => ({
  selector: {
    status: Posts.config.STATUS_PENDING
  },
  options: {
    sort: {createdAt: -1}
  }
}));

/**
 * @summary Rejected view
 */
Posts.addView("rejected", terms => ({
  selector: {
    status: Posts.config.STATUS_REJECTED
  },
  options: {
    sort: {createdAt: -1}
  }
}));

/**
 * @summary Scheduled view
 */
Posts.addView("scheduled", terms => ({
  selector: {
    status: Posts.config.STATUS_APPROVED,
    isFuture: true
  },
  options: {
    sort: {postedAt: -1}
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
  selector: {
    frontpage: true
  },
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

/**
 * @summary User posts view
 */
Posts.addView("userPosts", terms => ({
  selector: {
    userId: terms.userId,
    status: Posts.config.STATUS_APPROVED,
    isFuture: {$ne: true},
  },
  options: {
    limit: 5,
    sort: {
      postedAt: -1
    }
  }
}));

/**
 * @summary User upvoted posts view
 */
Posts.addView("userUpvotedPosts", (terms, apolloClient) => {
  var user = apolloClient ? Users.findOneInStore(apolloClient.store, terms.userId) : Users.findOne(terms.userId);

  var postsIds = _.pluck(user.upvotedPosts, "itemId");
  return {
    selector: {_id: {$in: postsIds}, userId: {$ne: terms.userId}}, // exclude own posts
    options: {limit: 5, sort: {postedAt: -1}}
  };
});

/**
 * @summary User downvoted posts view
 */
Posts.addView("userDownvotedPosts", (terms, apolloClient) => {
  var user = apolloClient ? Users.findOneInStore(apolloClient.store, terms.userId) : Users.findOne(terms.userId);

  var postsIds = _.pluck(user.downvotedPosts, "itemId");
  // TODO: sort based on votedAt timestamp and not postedAt, if possible
  return {
    selector: {_id: {$in: postsIds}},
    options: {limit: 5, sort: {postedAt: -1}}
  };
});
