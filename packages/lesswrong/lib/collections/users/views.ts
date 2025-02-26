import Users from "../users/collection";
import { spamRiskScoreThreshold } from "../../../components/common/RecaptchaWarning";
import pick from 'lodash/pick';
import isNumber from 'lodash/isNumber';
import mapValues from 'lodash/mapValues';
import { viewFieldNullOrMissing } from "@/lib/utils/viewConstants";

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

Users.addView("usersMapLocations", function () {
  return {
    selector: {
      mapLocationSet: true
    },
  }
})

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
