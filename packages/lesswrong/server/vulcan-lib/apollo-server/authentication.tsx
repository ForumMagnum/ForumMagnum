import React from 'react'
import { createMutator, updateMutator } from "..";
import passport from 'passport'
import bcrypt from 'bcrypt'
import { createHash, randomBytes } from "crypto";
import GraphQLLocalStrategy from "./graphQLLocalStrategy";
import { Strategy as GoogleOAuthStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookOAuthStrategy } from 'passport-facebook';
import { Strategy as GithubOAuthStrategy } from 'passport-github2';
import sha1 from 'crypto-js/sha1';
import { addGraphQLMutation, getSiteUrl, addGraphQLSchema, addGraphQLResolvers, Utils, slugify } from "../../../lib/vulcan-lib";
import { ForwardedWhitelist } from "../../forwarded_whitelist";
import { LWEvents } from "../../../lib/collections/lwevents";
import Users from "../../../lib/vulcan-users";
import { hashLoginToken } from "./apollo_server";
import { LegacyData } from '../../../lib/collections/legacyData/collection';
import { AuthenticationError } from 'apollo-server'
import { EmailTokenType } from "../../emails/emailTokens";
import { wrapAndSendEmail } from '../../notificationBatching';

async function comparePasswords(password, hash) {
  return await bcrypt.compare(createHash('sha256').update(password).digest('hex'), hash)
}

const passwordAuthStrategy = new GraphQLLocalStrategy(async function getUserPassport(username, password, done) {
  const user = await Users.findOne({$or: [{'emails.address': username}, {username: username}]});
  if (!user) return done(null, false, { message: 'Incorrect username.' });
  const match = await comparePasswords(password, user.services.password.bcrypt);

  // If no immediate match, we check whether we have a match with their legacy password
  if (!match) {
    // @ts-ignore -- legacyData isn't really handled right in our schemas.
    const dbLegacyData = user.legacyData ? user.legacyData : LegacyData.findOne({ objectId: user._id });
    if (dbLegacyData?.legacyData?.password) {
      const legacyData = dbLegacyData.legacyData
      const salt = legacyData.password.substring(0,3)
      const toHash = (`${salt}${user.username} ${password}`)
      const lw1PW = salt + sha1(toHash).toString();
      const lw1PWMatch = await comparePasswords(lw1PW, user.services.password.bcrypt);
      if (lw1PWMatch) return done(null, user)
    }
    return done(null, false, { message: 'Incorrect password.' });
  } 
  
  return done(null, user)
})

passport.use(passwordAuthStrategy)

function createOAuthUserHandler(idPath, getIdFromProfile, getUserDataFromProfile) {
  return async (accessToken, refreshToken, profile, done) => {
    const user = await Users.findOne({[idPath]: getIdFromProfile(profile)})
    if (!user) {
      const { data: user } = await createMutator({
        collection: Users,
        document: getUserDataFromProfile(profile),
        validate: false,
        currentUser: null
      })
      return done(null, user)
    }
    return done(null, user)
  }
}

passport.use(new GoogleOAuthStrategy({
    clientID: "630233024243-ujp4pqk2h8of5nsguo4g1lur3rrt804e.apps.googleusercontent.com",
    clientSecret: "O6VOctyzah9S97bK16-cFhTH",
    callbackURL: `${getSiteUrl()}auth/google/callback`,
    proxy: true
  },
  createOAuthUserHandler('services.google.id', profile => profile.id, profile => ({
    email: profile.emails[0].address,
    services: {
      google: profile
    },
    emails: profile.emails,
    username: Utils.getUnusedSlugByCollectionName("Users", slugify(profile.displayName)),
    displayName: profile.displayName,
    emailSubscribedToCurated: true
  }))
))

passport.use(new FacebookOAuthStrategy({
    clientID: "1482228762084891",
    clientSecret: "396e976ca3e58246b55f339968837461",
    callbackURL: `${getSiteUrl()}auth/facebook/callback`,
    profileFields: ['id', 'emails', 'name', 'displayName'],
    proxy: true
  },
  createOAuthUserHandler('services.facebook.id', profile => profile.id, profile => ({
    email: profile.emails[0].value,
    services: {
      facebook: profile
    },
    username: Utils.getUnusedSlugByCollectionName("Users", slugify(profile.displayName)),
    displayName: profile.displayName,
    emailSubscribedToCurated: true
  }))
))

passport.use(new GithubOAuthStrategy({
    clientID: "70e4b6aa0005f8cbdfc2",
    clientSecret: "23b06bca49400f6d2e63b8ac5c1a4500f1ca3666",
    callbackURL: `${getSiteUrl()}auth/github/callback`,
    scope: [ 'user:email' ], // fetches non-public emails as well
  },
  createOAuthUserHandler('services.github.id', profile => profile.id, profile => ({
    email: profile.emails[0].value,
    services: {
      github: profile
    },
    username: Utils.getUnusedSlugByCollectionName("Users", slugify(profile.username)),
    displayName: profile.username || profile.displayName,
    emailSubscribedToCurated: true
  }))
));

const loginData = `type LoginReturnData {
  token: String
}`

addGraphQLSchema(loginData);

function promisifiedAuthenticate(req, res, name, options, callback) {
  return new Promise((resolve, reject) => {
    try {
      passport.authenticate(name, options, async (err, user, info) => {
        try {
          const callbackResult = await callback(err, user, info);
          resolve(callbackResult)
        } catch(err) {
          reject(err)
        }
      })(req, res)
    } catch(err) {
      reject(err)
    }
  })
}

export async function createAndSetToken(req, res, user) {
  const token = randomBytes(32).toString('hex');
  (res as any).setHeader("Set-Cookie", `loginToken=${token}; Max-Age=315360000; Path=/`);

  const hashedToken = hashLoginToken(token)
  await insertHashedLoginToken(user._id, hashedToken)

  registerLoginEvent(user, req)
  return token
}

export const VerifyEmailToken = new EmailTokenType({
  name: "verifyEmail",
  onUseAction: async (user) => {
    await updateMutator({ 
      collection: Users,
      documentId: user._id,
      set: {
        'emails.0.verified': true,
      } as any,
      unset: {},
      validate: false,
    });
    return {message: "Your email has been verified" };
  },
  resultComponentName: "EmailTokenResult"
});

export const ResetPasswordToken = new EmailTokenType({
  name: "resetPassword",
  onUseAction: async (user) => {
    await updateMutator({ 
      collection: Users,
      documentId: user._id,
      set: {
        'emails.0.verified': true,
      } as any,
      unset: {},
      validate: false,
    });
    return {message: "Your email has been verified" };
  },
  resultComponentName: "EmailTokenResult",
});


const authenticationResolvers = {
  Mutation: {
    async login(root, { username, password }, { req, res }: ResolverContext) {
      let token:string | null = null

      await promisifiedAuthenticate(req, res, 'graphql-local', { username, password }, (err, user, info) => {
        return new Promise((resolve, reject) => {
          if (err) throw Error(err)
          if (!user) throw new AuthenticationError("Invalid username/password")
          if (user.banned && new Date(user.banned) > new Date()) throw new AuthenticationError("This user is banned")

          req!.logIn(user, async err => {
            if (err) throw new AuthenticationError(err)
            token = await createAndSetToken(req, res, user)
            resolve(token)
          })
        })
      })
      return { token }
    },
    async logout(root, {}, { req, res }: ResolverContext) {
      req!.logOut()
      if (req?.cookies.loginToken) {
        res!.setHeader("Set-Cookie", `loginToken= ; expires=${new Date(0).toUTCString()};`)   
      }
      if (req?.cookies['meteor_login_token']) {
        res!.setHeader("Set-Cookie", `meteor_login_token= ; expires=${new Date(0).toUTCString()};`)   
      }
      return {
        token: null
      }
    },
    async signup(root, { email, username, password, subscribeToCurated }, context: ResolverContext) {
      if (!email || !username || !password) throw Error("Email, Username and Password are all required for signup")
      const { req, res } = context
      const { data: user } = await createMutator({
        collection: Users,
        document: {
          email,
          services: {
            password: {
              bcrypt: createHash('sha256').update(password).digest('hex')
            },
            resume: {
              loginTokens: []
            }
          },
          emails: [{
            address: email, verified: false
          }],
          username: username,
          emailSubscribedToCurated: subscribeToCurated
        },
        validate: false,
        currentUser: null,
        context
      })
      const token = await createAndSetToken(req, res, user)
      return { 
        token
      }
    },
    async resetPassword(root, { email }, context: ResolverContext) {
      if (!email) throw Error("Email is required for resetting passwords")
      const user = await Users.findOne({email})
      if (!user) throw Error("Can't find user with given email address")
      const tokenLink = await ResetPasswordToken.generateLink(user._id, { handlerComponentName: "CommentsItem" })
      await wrapAndSendEmail({
        user,
        subject: "Password Reset Request",
        body: <body>
          <p>
            You requested a password reset. Follow the following link to reset your password: 
          </p>
          <p>
            <a href={tokenLink}></a>
          </p>
        </body>
      });  
    }
  } 
};

addGraphQLResolvers(authenticationResolvers);
addGraphQLMutation('login(username: String, password: String): LoginReturnData');
addGraphQLMutation('signup(username: String, email: String, password: String, subscribeToCurated: Boolean): LoginReturnData');
addGraphQLMutation('logout: LoginReturnData');

async function insertHashedLoginToken(userId, hashedToken) {
  const tokenWithMetadata = {
    when: new Date(),
    hashedToken
  }

  Users.update({_id: userId}, {
    $addToSet: {
      "services.resume.loginTokens": tokenWithMetadata
    }
  });
};


function registerLoginEvent(user, req) {
  const document = {
    name: 'login',
    important: false,
    userId: user._id,
    properties: {
      type: 'passport-login',
      ip: ForwardedWhitelist.getClientIP(req),
      userAgent: req.headers['user-agent'],
      referrer: req.headers['referer']
    }
  }
  void createMutator({
    collection: LWEvents,
    document: document,
    currentUser: user,
    validate: false,
  })
}
