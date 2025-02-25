import Users from "../users/collection";
import { ensureCustomPgIndex, ensureIndex } from '../../collectionIndexUtils';
import { spamRiskScoreThreshold } from "../../../components/common/RecaptchaWarning";
import pick from 'lodash/pick';
import isNumber from 'lodash/isNumber';
import mapValues from 'lodash/mapValues';
import { viewFieldNullOrMissing } from "../../vulcan-lib/collections";
import { isEAForum } from "../../instanceSettings";

declare global {
  interface UsersViewTerms extends ViewTermsBase {
    view?: UsersViewName
    sort?: {
      createdAt?: number,
      karma?: number,
      postCount?: number,
      commentCount?: number,
      afKarma?: number,
      afPostCount?: number,
      afCommentCount?: number,
    },
    userId?: string,
    userIds?: Array<string>,
    slug?: string,
    lng?: number
    lat?: number,
    profileTagId?: string,
    hasBio?: boolean
  }
}

// Auto-generated indexes from production
ensureIndex(Users, {username:1}, {unique:true,sparse:1});
ensureIndex(Users, {email:1}, {sparse:1});
ensureIndex(Users, {"emails.address":1}, {unique:true,sparse:1}); //TODO: deprecate emails field – do not build upon
ensureIndex(Users, {"services.resume.loginTokens.hashedToken":1}, {unique:true,sparse:1});
ensureIndex(Users, {"services.resume.loginTokens.token":1}, {unique:true,sparse:1});
ensureIndex(Users, {"services.resume.haveLoginTokensToDelete":1}, {sparse:1});
ensureIndex(Users, {"services.resume.loginTokens.when":1}, {sparse:1});
ensureIndex(Users, {"services.email.verificationTokens.token":1}, {unique:true,sparse:1});
ensureIndex(Users, {"services.password.reset.token":1}, {unique:true,sparse:1});
ensureIndex(Users, {"services.password.reset.when":1}, {sparse:1});
ensureIndex(Users, {"services.twitter.id":1}, {unique:true,sparse:1});
ensureIndex(Users, {"services.facebook.id":1}, {unique:true,sparse:1});
ensureIndex(Users, {"services.google.id":1}, {unique:true,sparse:1});
ensureIndex(Users, {karma:-1,_id:-1});
ensureIndex(Users, {slug:1});
ensureIndex(Users, {isAdmin:1});
ensureIndex(Users, {"services.github.id":1}, {unique:true,sparse:1});
ensureIndex(Users, {createdAt:-1,_id:-1});

// Used by UsersRepo.getUserByLoginToken
ensureIndex(Users, {"services.resume.loginTokens": 1});

// Case-insensitive email index
ensureIndex(Users, {email: 1}, {sparse: 1, collation: { locale: 'en', strength: 2 }})
ensureIndex(Users, {'emails.address': 1}, {sparse: 1, unique: true, collation: { locale: 'en', strength: 2 }}) //TODO: Deprecate or change to use email

const termsToMongoSort = (terms: UsersViewTerms) => {
  if (!terms.sort)
    return undefined;
  
  const filteredSort = pick(terms.sort, [
    "createdAt", "karma", "postCount", "commentCount",
    "afKarma", "afPostCount", "afCommentCount",
  ]);
  return mapValues(filteredSort,
    v => isNumber(v) ? v : 1
  );
}

Users.addView('usersByUserIds', function(terms: UsersViewTerms) {
  return {
    selector: {_id: {$in:terms.userIds}}
  }
})

Users.addView('usersProfile', function(terms: UsersViewTerms) {
  if (terms.userId) {
    return {
      selector: {_id:terms.userId}
    }
  }

  return {
    selector: {$or: [{slug: terms.slug}, {oldSlugs: terms.slug}]},
  }
});

ensureIndex(Users, {oldSlugs:1});

Users.addView('LWSunshinesList', function(terms: UsersViewTerms) {
  return {
    selector: {groups:'sunshineRegiment'},
    options: {
      sort: termsToMongoSort(terms),
    }
  }
});

Users.addView('LWTrustLevel1List', function(terms: UsersViewTerms) {
  return {
    selector: {groups:'trustLevel1'},
    options: {
      sort: termsToMongoSort(terms),
    }
  }
});

Users.addView('LWUsersAdmin', (terms: UsersViewTerms) => ({
  options: {
    sort: termsToMongoSort(terms),
  }
}));

Users.addView("usersWithBannedUsers", function () {
  return {
    selector: {
      $or: [{bannedPersonalUserIds: {$ne:null}}, {bannedUserIds: {$ne:null}}]
    },
  }
})

ensureIndex(Users, {bannedPersonalUserIds:1, createdAt:1});
ensureIndex(Users, {bannedUserIds:1, createdAt:1});

Users.addView("sunshineNewUsers", function (terms: UsersViewTerms) {
  return {
    selector: {
      needsReview: true,
      banned: viewFieldNullOrMissing,
      reviewedByUserId: null,
      $or: [{signUpReCaptchaRating: {$gt: spamRiskScoreThreshold*1.25}}, {signUpReCaptchaRating: {$exists: false}}, {signUpReCaptchaRating:null}]
    },
    options: {
      sort: {
        sunshineFlagged: -1,
        reviewedByUserId: 1,
        postCount: -1,
        commentCount: -1,
        signUpReCaptchaRating: -1,
        createdAt: -1
      }
    }
  }
})
ensureIndex(Users, {needsReview: 1, signUpReCaptchaRating: 1, createdAt: -1})

Users.addView("recentlyActive", function (terms: UsersViewTerms) {
  return {
    selector: {
      $or: [
        {commentCount: {$gt: 0}},
        {postCount: {$gt: 0}},
      ]
    },
    options: {
      sort: {
        lastNotificationsCheck: -1,
      }
    }
  }  
})
ensureIndex(Users, {banned: 1, postCount: 1, commentCount: -1, lastNotificationsCheck: -1})

Users.addView("allUsers", function (terms: UsersViewTerms) {
  return {
    options: {
      sort: {
        ...termsToMongoSort(terms),
        reviewedAt: -1,
        createdAt: -1
      }
    }
  }
})
ensureIndex(Users, {reviewedAt: -1, createdAt: -1})

Users.addView("usersMapLocations", function () {
  return {
    selector: {
      mapLocationSet: true
    },
  }
})
ensureIndex(Users, {mapLocationSet: 1})

Users.addView("tagCommunityMembers", function (terms: UsersViewTerms) {
  const bioSelector = terms.hasBio ? {
    $and: [
      {'biography.html': {$exists: true}},
      {'biography.html': {$ne: ''}}
    ]
  } : {}
  
  return {
    selector: {
      profileTagIds: terms.profileTagId,
      deleted: {$ne: true},
      deleteContent: {$ne: true},
      ...bioSelector
    },
    options: {
      sort: {
        karma: -1
      }
    }
  }
})
ensureIndex(Users, {profileTagIds: 1, deleted: 1, deleteContent: 1, karma: 1})

Users.addView("reviewAdminUsers", function (terms: UsersViewTerms) {
  return {
    selector: {
      karma: {$gte: 1000},
    },
    options: {
      sort: {
        karma: -1
      }
    }
  }
})

Users.addView("usersWithPaymentInfo", function (terms: UsersViewTerms) {
  return {
    selector: {
      banned: viewFieldNullOrMissing,
      deleted: {$ne:true},
      $or: [{ paymentEmail: {$exists: true}}, {paymentInfo: {$exists: true}}],
    },
    options: {
      sort: {
        displayName: 1
      }
    }
  }
})

export const hashedPetrovLaunchCodes = [
  "KEDzA2lmOdFDFweWi6jWe9kerEYXGn4qvXjrI41S4bc=",
  "iEe7eacQU9TLDrB+bkEDW5/Ti6EkZzNfsHvE/0rlRE8=",
  "jQLUwGlfOYo2+uczUN6bBBnOuzyek18dcoYaCWmtACA=",
  "U7IzacSbqJA27Xpm8YU5MExdf0JNH20GTYd0fIKEbag=",
]

/*Users.addView("areWeNuked", function () {
  return {
    selector: {
      petrovCodesEnteredHashed: {$in: hashedPetrovLaunchCodes}
    },
  }
})
ensureIndex(Users, {petrovCodesEnteredHashed: 1})*/



Users.addView("walledGardenInvitees", function () {
  return {
    selector: {
      walledGardenInvite: true
    },
    options: {
      sort: {
        displayName: 1
      }
    }
  }
})
ensureIndex(Users, {walledGardenInvite: 1})

Users.addView("usersWithOptedInToDialogueFacilitation", function (terms: UsersViewTerms) {
  return {
    selector: {
      optedInToDialogueFacilitation: true
    },
    options: {
      sort: {
        karma: -1
      }
    }
  }
})

ensureIndex(Users, { optedInToDialogueFacilitation: 1, karma: -1 });

// These partial indexes are set up to allow for a very efficient index-only scan when deciding which userIds need to be emailed for post curation.
// Used by `CurationEmailsRepo.getUserIdsToEmail`.
// The EA Forum version of the index is missing the fm_has_verified_email conditional to match the behavior of `reasonUserCantReceiveEmails`.
void ensureCustomPgIndex(`
  CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_Users_subscribed_to_curated_verified"
  ON "Users" USING btree (
    "emailSubscribedToCurated",
    "unsubscribeFromAll",
    "deleted",
    "email",
    fm_has_verified_email(emails),
    "_id"
  )
  WHERE "emailSubscribedToCurated" IS TRUE
    AND "unsubscribeFromAll" IS NOT TRUE
    AND "deleted" IS NOT TRUE
    AND "email" IS NOT NULL
    AND fm_has_verified_email(emails);
`, {
  dependencies: [
    {type: "function", name: "fm_has_verified_email"}
  ],
});

void ensureCustomPgIndex(`
  CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_Users_subscribed_to_curated"
  ON "Users" USING btree (
    "emailSubscribedToCurated",
    "unsubscribeFromAll",
    "deleted",
    "email",
    "_id"
  )
  WHERE "emailSubscribedToCurated" IS TRUE
    AND "unsubscribeFromAll" IS NOT TRUE
    AND "deleted" IS NOT TRUE
    AND "email" IS NOT NULL;
`);
