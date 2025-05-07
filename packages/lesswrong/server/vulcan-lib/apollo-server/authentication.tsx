import React from 'react'
import passport from 'passport'
import bcrypt from 'bcrypt'
import { createHash, randomBytes } from "crypto";
import GraphQLLocalStrategy from "./graphQLLocalStrategy";
import sha1 from 'crypto-js/sha1';
import { getClientIP } from '@/server/utils/getClientIP';
import Users from "../../../server/collections/users/collection";
import { hashLoginToken, userIsBanned } from "../../loginTokens";
import { LegacyData } from '../../../server/collections/legacyData/collection';
import { AuthenticationError } from 'apollo-server'
import { EmailTokenType } from "../../emails/emailTokens";
import { wrapAndSendEmail } from '../../emails/renderEmail';
import SimpleSchema from 'simpl-schema';
import { userEmailAddressIsVerified} from '../../../lib/collections/users/helpers';
import { clearCookie } from '../../utils/httpUtil';
import { DatabaseServerSetting } from "../../databaseSettings";
import request from 'request';
import { forumTitleSetting } from '../../../lib/instanceSettings';
import {userFindOneByEmail} from "../../commonQueries";
import UsersRepo from '../../repos/UsersRepo';
import gql from 'graphql-tag';
import { createLWEvent } from '@/server/collections/lwevents/mutations';
import { computeContextFromUser } from './context';
import { createUser } from '@/server/collections/users/mutations';

// Meteor hashed its passwords twice, once on the client
// and once again on the server. To preserve backwards compatibility
// with Meteor passwords, we do the same, but do it both on the server-side
function createMeteorClientSideHash(password: string) {
  return createHash('sha256').update(password).digest('hex')
}

async function createPasswordHash(password: string) {
  const meteorClientSideHash = createMeteorClientSideHash(password)
  return await bcrypt.hash(meteorClientSideHash, 10)
}


async function comparePasswords(password: string, hash: string) {
  return await bcrypt.compare(createMeteorClientSideHash(password), hash)
}

const passwordAuthStrategy = new GraphQLLocalStrategy(async function getUserPassport(username, password, done) {
  const user = await new UsersRepo().getUserByUsernameOrEmail(username);

  if (!user) return done(null, false, { message: 'Invalid login.' }); //Don't reveal that an email exists in DB
  
  // Load legacyData, if applicable. Needed because imported users had their
  // passwords hashed differently.
  // @ts-ignore -- legacyData isn't really handled right in our schemas.
  const legacyData = user.legacyData ? user.legacyData : await LegacyData.findOne({ objectId: user._id })?.legacyData;
  
  if (legacyData?.password && legacyData.password===password) {
    // For legacy accounts, the bcrypt-hashed password stored in user.services.password.bcrypt
    // is a hash of the LW1-hash of their password. Don't accept an LW1-hash as a password.
    // (If passwords from the DB were ever leaked, this prevents logging into legacy accounts
    // that never changed their password.)
    return done(null, false, { message: 'Incorrect password.' });
  }
  
  const match = !!user.services.password.bcrypt && await comparePasswords(password, user.services.password?.bcrypt);

  // If no immediate match, we check whether we have a match with their legacy password
  if (!match) {
    if (legacyData?.password) {
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


function validatePassword(password: string): {validPassword: true} | {validPassword: false, reason: string} {
  if (password.length < 6) return { validPassword: false, reason: "Your password needs to be at least 6 characters long"}
  return { validPassword: true }
}

function validateUsername(username: string): {validUsername: true} | {validUsername: false, reason: string} {
  if (username.length < 2) {
    return { validUsername: false, reason: "Your username must be at least 2 characters" };
  }
  if (username.trim() !== username) {
    return { validUsername: false, reason: "Your username can't start or end with whitespace" };
  }
  for (let i=0; i<username.length-1; i++) {
    if (username.substring(i, i+2).trim() === '') {
      return { validUsername: false, reason: "Your username can't contain consecutive whitespace characters" };
    }
  }
  for (let i=0; i<username.length; i++) {
    const ch = username.charAt(i);
    if (!isValidCharInUsername(ch)) {
      return { validUsername: false, reason: `Your username can't contain a "${ch}"` };
    }
  }
  
  return {validUsername: true};
}

function isValidCharInUsername(ch: string): boolean {
  const restrictedChars = [
    '\u0000', // Null
    '\uFEFF', // Byte order mark (BOM)
    '\u202E', '\u202D', // RTL and LTR override
    '\n', '\\', '/', '<', '>', '"',
  ]
  return !restrictedChars.includes(ch);
}


type PassportAuthenticateCallback = Exclude<Parameters<typeof passport.authenticate>[2], undefined>;
// `options` should be `passport.AuthenticateOptions`, but those don't contain `username` and `password` in the type definition.
// No idea where they're actually coming from, in that case
function promisifiedAuthenticate(req: ResolverContext['req'], res: ResolverContext['res'], name: string, options: any, callback: PassportAuthenticateCallback) {
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

export async function createAndSetToken(req: AnyBecauseTodo, res: AnyBecauseTodo, user: DbUser) {
  const token = randomBytes(32).toString('hex');
  (res as any).setHeader("Set-Cookie", `loginToken=${token}; Max-Age=315360000; Path=/`);

  const hashedToken = hashLoginToken(token)
  await insertHashedLoginToken(user._id, hashedToken)

  registerLoginEvent(user, req)
  return token
}


const VerifyEmailToken = new EmailTokenType({
  name: "verifyEmail",
  onUseAction: async (user) => {
    if (userEmailAddressIsVerified(user)) return {message: "Your email address is already verified"}
    await new UsersRepo().verifyEmail(user._id);
    return {message: "Your email has been verified" };
  },
  resultComponentName: "EmailTokenResult"
});


export async function sendVerificationEmail(user: DbUser) {
  const verifyEmailLink = await VerifyEmailToken.generateLink(user._id);
  await wrapAndSendEmail({
    user,
    force: true,
    subject: `Verify your ${forumTitleSetting.get()} email`,
    body: <div>
      <p>
        Click here to verify your {forumTitleSetting.get()} email
      </p>
      <p>
        <a href={verifyEmailLink}>
          {verifyEmailLink}
        </a>
      </p>
    </div>
  })
}

const ResetPasswordToken = new EmailTokenType({
  name: "resetPassword",
  onUseAction: async (user, params, args) => {
    if (!args) throw Error("Using a reset-password token requires providing a new password")
    const { password } = args
    const validatePasswordResponse = validatePassword(password)
    if (!validatePasswordResponse.validPassword) throw Error(validatePasswordResponse.reason)

    await new UsersRepo().resetPassword(user._id, await createPasswordHash(password));
    return {message: "Your new password has been set. Try logging in again." };
  },
  resultComponentName: "EmailTokenResult",
  path: "resetPassword" // Defined in routes.ts
});

export const loginDataGraphQLTypeDefs = gql`
  type LoginReturnData {
    token: String
  }
  extend type Mutation {
    login(username: String, password: String): LoginReturnData
    signup(username: String, email: String, password: String, subscribeToCurated: Boolean, reCaptchaToken: String, abTestKey: String): LoginReturnData
    logout: LoginReturnData
    resetPassword(email: String): String
  }
`

export const loginDataGraphQLMutations = {
  async login(root: void, { username, password }: {username: string, password: string}, { req, res }: ResolverContext) {
    let token: string | null = null

    await promisifiedAuthenticate(req, res, 'graphql-local', { username, password }, (err, user, info) => {
      return new Promise((resolve, reject) => {
        if (err) throw Error(err)
        if (!user) throw new AuthenticationError("Invalid username/password")
        if (userIsBanned(user)) throw new AuthenticationError("This user is banned")

        req!.logIn(user, async (err: AnyBecauseTodo) => {
          if (err) throw new AuthenticationError(err)
          token = await createAndSetToken(req, res, user)
          resolve(token)
        })
      })
    })
    return { token }
  },
  async logout(root: void, args: {}, { req, res }: ResolverContext) {
    if (req) {
      req.logOut()
      clearCookie(req, res, "loginToken");
      clearCookie(req, res, "meteor_login_token");  
    }
    return {
      token: null
    }
  },
  async signup(root: void, args: AnyBecauseTodo, context: ResolverContext) {
    const { email, username, password, subscribeToCurated, reCaptchaToken, abTestKey } = args;
    
    if (!email || !username || !password) throw Error("Email, Username and Password are all required for signup")
    if (!SimpleSchema.RegEx.Email.test(email)) throw Error("Invalid email address")
    const validatePasswordResponse = validatePassword(password)
    if (!validatePasswordResponse.validPassword) throw Error(validatePasswordResponse.reason)
    const validateUsernameResponse = validateUsername(username);
    if (!validateUsernameResponse.validUsername) throw Error(validateUsernameResponse.reason)
    
    if (await userFindOneByEmail(email)) {
      throw Error("Email address is already taken");
    }
    if (await context.Users.findOne({ username })) {
      throw Error("Username is already taken");
    }

    const reCaptchaResponse = await getCaptchaRating(reCaptchaToken)
    let recaptchaScore: number | undefined = undefined
    if (reCaptchaResponse) {
      const reCaptchaData = JSON.parse(reCaptchaResponse)
      if (reCaptchaData.success && reCaptchaData.action === "login/signup") {
        recaptchaScore = reCaptchaData.score
      } else {
        // eslint-disable-next-line no-console
        console.log("reCaptcha check failed:", reCaptchaData)
      }
    }

    const { req, res } = context
    
    const user = await createUser({
      data: {
        email,
        services: {
          password: {
            bcrypt: await createPasswordHash(password)
          },
          resume: {
            loginTokens: []
          }
        },
        emails: [{
          address: email, verified: false
        }],
        username: username,
        displayName: username,
        emailSubscribedToCurated: subscribeToCurated,
        signUpReCaptchaRating: recaptchaScore,
        abTestKey,
      } as CreateUserDataInput // We need the cast because `services` isn't accepted in the create API.  That also means we need to skip validation.
    }, context);

    const token = await createAndSetToken(req, res, user)
    return { 
      token
    }
  },
  async resetPassword(root: void, { email }: {email: string}, context: ResolverContext) {
    if (!email) throw Error("Email is required for resetting passwords")
    const user = await userFindOneByEmail(email)
    if (!user) throw Error("Can't find user with given email address")
    const tokenLink = await ResetPasswordToken.generateLink(user._id)
    const emailSucceeded = await wrapAndSendEmail({
      user,
      force: true,
      subject: "Password Reset Request",
      body: <div>
        <p>
          You requested a password reset. Follow the following link to reset your password: 
        </p>
        <p>
          <a href={tokenLink}>{tokenLink}</a>
        </p>
      </div>
    });  
    if (emailSucceeded)
      return `Successfully sent password reset email to ${email}`; //FIXME: Is this revealing user emails that would otherwise be hidden?
    else
      return `Failed to send password reset email. The account might not have a valid email address configured.`;
  },
}


async function insertHashedLoginToken(userId: string, hashedToken: string) {
  const tokenWithMetadata = {
    when: new Date(),
    hashedToken
  }

  await Users.rawUpdateOne({_id: userId}, {
    $addToSet: {
      "services.resume.loginTokens": tokenWithMetadata
    }
  });
};


function registerLoginEvent(user: DbUser, req: AnyBecauseTodo) {
  const document = {
    name: 'login',
    important: false,
    userId: user._id,
    properties: {
      type: 'passport-login',
      ip: getClientIP(req),
      userAgent: req.headers['user-agent'],
      referrer: req.headers['referer']
    }
  }
  void computeContextFromUser({ user, isSSR: false }).then(userContext => {
    void createLWEvent({ data: document }, userContext);
  });
}

const reCaptchaSecretSetting = new DatabaseServerSetting<string | null>('reCaptcha.secret', null) // ReCaptcha Secret
const getCaptchaRating = async (token: string): Promise<string|null> => {
  // Make an HTTP POST request to get reply text
  return new Promise((resolve, reject) => {
    if (reCaptchaSecretSetting.get()) {
      request.post({url: 'https://www.google.com/recaptcha/api/siteverify',
          form: {
            secret: reCaptchaSecretSetting.get(),
            response: token
          }
        },
        function(err, httpResponse, body) {
          if (err) reject(err);
          return resolve(body);
        }
      );
    } else {
      resolve(null);
    }
  });
}
