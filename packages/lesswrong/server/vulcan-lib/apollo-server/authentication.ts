import { addGraphQLSchema, addGraphQLResolvers, addGraphQLQuery } from "../../../lib/vulcan-lib/graphql";
import { createMutator } from "../mutators";
import passport from 'passport'
import bcrypt from 'bcrypt'
import { createHash, randomBytes } from "crypto";
import GraphQLLocalStrategy from "./graphQLLocalStrategy";
import sha1 from 'crypto-js/sha1';
import { addGraphQLMutation, logoUrlSetting } from "../../../lib/vulcan-lib";
import { getForwardedWhitelist } from "../../forwarded_whitelist";
import { LWEvents } from "../../../lib/collections/lwevents";
import Users from "../../../lib/vulcan-users";
import { hashLoginToken } from "../../loginTokens";
import { LegacyData } from '../../../lib/collections/legacyData/collection';
import { AuthenticationError } from 'apollo-server'

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

async function createAndSetToken(req, res, user) {
  const token = randomBytes(32).toString('hex');
  (res as any).setHeader("Set-Cookie", `loginToken=${token}; Max-Age=315360000`);

  const hashedToken = hashLoginToken(token)
  await insertHashedLoginToken(user._id, hashedToken)

  registerLoginEvent(user, req)
  return token
}

const authenticationResolvers = {
  Mutation: {
    async login(root, { username, password }, { req, res }: ResolverContext) {
      let token:string | null = null

      await promisifiedAuthenticate(req, res, 'graphql-local', { username, password }, async (err, user, info) => {
        if (err) throw Error(err)
        if (!user) throw new AuthenticationError("Invalid username/password")
        if (user.banned && new Date(user.banned) > new Date()) throw new AuthenticationError("This user is banned")

        req!.logIn(user, async err => {
          if (err) throw new AuthenticationError(err)
          token = await createAndSetToken(req, res, user)
        })
      })
      
      return { token }
    },
    async logout(root, args: {}, { req, res }: ResolverContext) {
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
      const { req, res } = context
      const user = await createMutator({
        collection: Users,
        document: {
          email,
          services: {
            password: {
              bcrypt: createHash('sha256').update(password).digest('hex')
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
      const token = createAndSetToken(req, res, user)
      return { 
        token
      }
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

  await Users.update({_id: userId}, {
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
      ip: getForwardedWhitelist().getClientIP(req),
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
