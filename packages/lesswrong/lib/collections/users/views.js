import Users from "meteor/vulcan:users";
import { getSetting } from "meteor/vulcan:core";
import { ensureIndex } from '../../collectionUtils';

// Auto-generated indexes from production
ensureIndex(Users, {username:1}, {unique:true,sparse:1});
ensureIndex(Users, {"emails.address":1}, {unique:true,sparse:1});
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

Users.addView('usersProfile', function(terms) {
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

Users.addView('LWSunshinesList', function(terms) {
  return {
    selector: {groups:'sunshineRegiment'},
    options: {
      sort: terms.sort
    }
  }
});

Users.addView('LWTrustLevel1List', function(terms) {
  return {
    selector: {groups:'trustLevel1'},
    options: {
      sort: terms.sort
    }
  }
});

Users.addView('LWUsersAdmin', terms => ({
  options: {
    sort: terms.sort
  }
}));

Users.addView("usersWithBannedUsers", function () {
  return {
    selector: {
      bannedUserIds: {$exists: true}
    },
  }
})

Users.addView("sunshineNewUsers", function () {
  let reCaptchaSelector = {signUpReCaptchaRating: {$gt: 0.3}}
  if (!getSetting('requireReCaptcha')) {
    reCaptchaSelector = {
      $or: [
        {signUpReCaptchaRating: {$exists: false}},
        reCaptchaSelector,
      ]
    }
  }
  return {
    selector: {
      $or: [
        { voteCount: {$gt: 12}},
        { commentCount: {$gt: 0}},
        { postCount: {$gt: 0}, ...reCaptchaSelector},
        { bio: {$exists: true}},
      ],
      reviewedByUserId: {$exists: false},
      banned: {$exists: false},
    },
  }
})
ensureIndex(Users, {voteCount: 1, reviewedByUserId: 1, banned: 1})
ensureIndex(Users, {commentCount: 1, reviewedByUserId: 1, banned: 1})
ensureIndex(Users, {postCount: 1, signUpReCaptchaRating: 1, reviewedByUserId: 1, banned: 1})
ensureIndex(Users, {bio: 1, reviewedByUserId: 1, banned: 1})
