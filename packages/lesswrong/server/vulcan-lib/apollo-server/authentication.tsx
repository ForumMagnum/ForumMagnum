import React from 'react'
import { randomBytes } from "crypto";
import sha1 from 'crypto-js/sha1';
import { getClientIP } from '@/server/utils/getClientIP';
import Users from "../../../server/collections/users/collection";
import { hashLoginToken, userIsBanned } from "../../loginTokens";
import { LegacyData } from '../../../server/collections/legacyData/collection';
import { wrapAndSendEmail } from '../../emails/renderEmail';
import SimpleSchema from '@/lib/utils/simpleSchema';
import { reCaptchaSecretSetting } from "../../databaseSettings";
import {userFindOneByEmail} from "../../commonQueries";
import UsersRepo from '../../repos/UsersRepo';
import gql from 'graphql-tag';
import { createLWEvent } from '@/server/collections/lwevents/mutations';
import { computeContextFromUser } from './context';
import { createUser } from '@/server/collections/users/mutations';
import { createDisplayName } from '@/lib/collections/users/newSchema';
import { comparePasswords, createPasswordHash, validatePassword } from './passwordHelpers';
import type { NextRequest } from 'next/server';
import { backgroundTask } from '@/server/utils/backgroundTask';

// Given an HTTP request, clear a named cookie. Handles the difference between
// the Meteor and Express server middleware setups. Works by setting an
// expiration date in the past, which apparently is the recommended way to
// remove cookies.
async function clearCookie(cookieName: string) {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}

type AuthenticateWithPasswordResult = {
  success: true;
  user: DbUser;
} | {
  success: false;
  message: string;
};

async function authenticateWithPassword(username: string, password: string): Promise<AuthenticateWithPasswordResult> {
  const user = await new UsersRepo().getUserByUsernameOrEmail(username);

  if (!user) return { success: false, message: 'Invalid login.' }; //Don't reveal that an email exists in DB
  
  // Load legacyData, if applicable. Needed because imported users had their
  // passwords hashed differently.
  // @ts-ignore -- legacyData isn't really handled right in our schemas.
  const legacyData = user.legacyData ? user.legacyData : await LegacyData.findOne({ objectId: user._id })?.legacyData;
  
  if (legacyData?.password && legacyData.password===password) {
    // For legacy accounts, the bcrypt-hashed password stored in user.services.password.bcrypt
    // is a hash of the LW1-hash of their password. Don't accept an LW1-hash as a password.
    // (If passwords from the DB were ever leaked, this prevents logging into legacy accounts
    // that never changed their password.)
    return { success: false, message: 'Incorrect password.' };
  }
  
  const match = !!user.services?.password.bcrypt && await comparePasswords(password, user.services.password?.bcrypt);

  // If no immediate match, we check whether we have a match with their legacy password
  if (!match) {
    if (legacyData?.password) {
      const salt = legacyData.password.substring(0,3)
      const toHash = (`${salt}${user.username} ${password}`)
      const lw1PW = salt + sha1(toHash).toString();
      const lw1PWMatch = await comparePasswords(lw1PW, user.services.password.bcrypt);
      if (lw1PWMatch) return { success: true, user }
    }
    return { success: false, message: 'Incorrect password.' };
  } 
  return { success: true, user }
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

export async function createAndSetToken(headers: Headers|undefined, user: DbUser) {
  const { cookies } = await import('next/headers');

  const token = randomBytes(32).toString('hex');
  const cookieStore = await cookies();
  cookieStore.set("loginToken", token, {
    maxAge: 315360000,
    path: "/",
  });

  const hashedToken = hashLoginToken(token)
  await insertHashedLoginToken(user._id, hashedToken)

  registerLoginEvent(user, headers)
  return token
}




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
  async login(root: void, { username, password }: {username: string, password: string}, { headers }: ResolverContext) {
    const result = await authenticateWithPassword(username, password);
    if (!result.success) {
      throw new Error(result.message);
    }

    const { user } = result;
    if (userIsBanned(user)) {
      throw new Error("This user is banned");
    }

    const token = await createAndSetToken(headers, user);

    return { token }
  },
  async logout(root: void, args: {}, context: ResolverContext) {
    await clearCookie("loginToken");
    await clearCookie("meteor_login_token");
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

    const { headers } = context

    const userData = {
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
      emailSubscribedToCurated: subscribeToCurated,
      signUpReCaptchaRating: recaptchaScore,
      abTestKey,
    };

    const displayName = createDisplayName(userData);
    
    const user = await createUser({
      data: {
        ...userData,
        displayName,
      },
    }, context);

    const token = await createAndSetToken(headers, user)
    return { 
      token
    }
  },
  async resetPassword(root: void, { email }: {email: string}, context: ResolverContext) {
    if (!email) throw Error("Email is required for resetting passwords")
    const user = await userFindOneByEmail(email)
    if (!user) throw Error("Can't find user with given email address")
    const { emailTokenTypesByName } = await import("@/server/emails/emailTokens");

    const tokenLink = await emailTokenTypesByName.resetPassword.generateLink(user._id)
    const emailSucceeded = await wrapAndSendEmail({
      user,
      force: true,
      subject: "Password Reset Request",
      body: (emailContext) => <div>
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


function registerLoginEvent(user: DbUser, headers: Headers|undefined) {
  const document = {
    name: 'login',
    important: false,
    userId: user._id,
    properties: {
      type: 'passport-login',
      ip: getClientIP(headers),
      userAgent: headers?.get('user-agent'),
      referrer: headers?.get('referer')
    }
  }
  const context = computeContextFromUser({ user, isSSR: false });
  backgroundTask(createLWEvent({ data: document }, context));
}

const getCaptchaRating = async (token: string): Promise<string|null> => {
  const { default: request } = await import('request');

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
