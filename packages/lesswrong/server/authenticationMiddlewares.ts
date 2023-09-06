import passport, { Profile } from 'passport'
import { createAndSetToken } from './vulcan-lib/apollo-server/authentication';
import { Strategy as CustomStrategy } from 'passport-custom'
import { getUser } from './vulcan-lib/apollo-server/context';
import { Users } from '../lib/collections/users/collection';
import { getCookieFromReq } from './utils/httpUtil';
import { Strategy as GoogleOAuthStrategy, Profile as GoogleProfile, VerifyCallback as GoogleVerifyCallback } from 'passport-google-oauth20';
import { Strategy as FacebookOAuthStrategy, Profile as FacebookProfile } from 'passport-facebook';
import { Strategy as GithubOAuthStrategy, Profile as GithubProfile } from 'passport-github2';
import { Strategy as Auth0Strategy, Profile as Auth0Profile, ExtraVerificationParams, AuthenticateOptions } from 'passport-auth0';
import { VerifyCallback } from 'passport-oauth2'
import { DatabaseServerSetting } from './databaseSettings';
import { createMutator, updateMutator } from './vulcan-lib/mutators';
import { combineUrls, getSiteUrl, slugify, Utils } from '../lib/vulcan-lib/utils';
import pick from 'lodash/pick';
import { isEAForum, siteUrlSetting } from '../lib/instanceSettings';
import { userFromAuth0Profile } from './authentication/auth0Accounts';
import { captureException } from '@sentry/core';
import moment from 'moment';
import {userFindOneByEmail, usersFindAllByEmail} from "./commonQueries";

/**
 * Passport declares an empty interface User in the Express namespace. We modify
 * it once here, and then all Passport user typings will use it.
 *
 * See: https://github.com/DefinitelyTyped/DefinitelyTyped/commit/91c229dbdb653dbf0da91992f525905893cbeb91#r34805708
 *
 * It appears that passport is the only user of Express.User, so this choice
 * only affects the shape of user objects in this file.
 */
declare global {
  // @types/passport made the decision to use the Express namespace. We're
  // constrained to follow it
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface User extends DbUser {
    }
  }
}

// Extend Auth0Strategy to include the missing userProfile method
class Auth0StrategyFixed extends Auth0Strategy {
  userProfile!: any;
}

const googleClientIdSetting = new DatabaseServerSetting<string | null>('oAuth.google.clientId', null)
const googleOAuthSecretSetting = new DatabaseServerSetting<string | null>('oAuth.google.secret', null)

const auth0ClientIdSetting = new DatabaseServerSetting<string | null>('oAuth.auth0.appId', null)
const auth0OAuthSecretSetting = new DatabaseServerSetting<string | null>('oAuth.auth0.secret', null)
const auth0DomainSetting = new DatabaseServerSetting<string | null>('oAuth.auth0.domain', null)

const facebookClientIdSetting = new DatabaseServerSetting<string | null>('oAuth.facebook.appId', null)
const facebookOAuthSecretSetting = new DatabaseServerSetting<string | null>('oAuth.facebook.secret', null)

const githubClientIdSetting = new DatabaseServerSetting<string | null>('oAuth.github.clientId', null)
const githubOAuthSecretSetting = new DatabaseServerSetting<string | null>('oAuth.github.secret', null)
export const expressSessionSecretSetting = new DatabaseServerSetting<string | null>('expressSessionSecret', null)


type IdFromProfile<P extends Profile> = (profile: P) => string | number
type UserDataFromProfile<P extends Profile> = (profile: P) => Promise<Partial<DbUser>>

async function mergeAccount(profilePath: string, user: DbUser, profile: Profile) {
  return await updateMutator({
    collection: Users,
    documentId: user._id,
    set: {[profilePath]: profile} as any,
    // Normal updates are not supposed to update services
    validate: false
  })
}

/**
 * Given the provider-appropriate ways to get user info from a profile, create
 * a function that handles successful logins from that provider
 */
function createOAuthUserHandler<P extends Profile>(profilePath: string, getIdFromProfile: IdFromProfile<P>, getUserDataFromProfile: UserDataFromProfile<P>) {
  return async (_accessToken: string, _refreshToken: string, profile: P, done: VerifyCallback) => {
    try {
      const profileId = getIdFromProfile(profile)
      // Probably impossible
      if (!profileId) {
        throw new Error('OAuth profile does not have a profile ID')
      }
      // TODO: We use a string representation of the profileId because we have Github IDs stored as strings but we get them as numbers
      // And our query builder can't yet handle that case correctly
      let user = await Users.findOne({[`${profilePath}.id`]: `${profileId}`})
      if (!user) {
        const email = profile.emails?.[0]?.value 
        
        // Don't enforce having an email. Facebook OAuth accounts don't necessarily
        // have an email address associated (or visible to us).
        //
        // If an email *is* provided, the OAuth provider verified it, and we should
        // be able to trust that.
        if (email) {
          // Collation here means we're using the case-insensitive index
          const matchingUsers = await usersFindAllByEmail(email)
          if (matchingUsers.length > 1) {
            throw new Error(`Multiple existing users found with email ${email}, please contact support`)
          }
          const user = matchingUsers[0]
          if (user) {
            const { data: userUpdated } = await mergeAccount(profilePath, user, profile)
            if (user.banned && new Date(user.banned) > new Date()) {
              return done(new Error("banned"))
            }
            return done(null, userUpdated)
          }
        }
        const { data: userCreated } = await createMutator({
          collection: Users,
          document: await getUserDataFromProfile(profile),
          validate: false,
          currentUser: null
        })
        return done(null, userCreated)
      }
      user = await syncOAuthUser(user, profile)
      if (user.banned && new Date(user.banned) > new Date()) {
        return done(new Error("banned"))
      }
      return done(null, user)
    } catch (err) {
      captureException(err);
      return done(err)
    }
  }
}

/**
 * Auth0 passes 5 parameters, not 4, so we need to wrap createOAuthUserHandler
 */
function createOAuthUserHandlerAuth0(profilePath: string, getIdFromProfile: IdFromProfile<Auth0Profile>, getUserDataFromProfile: UserDataFromProfile<Auth0Profile>) {
  const standardHandler = createOAuthUserHandler(profilePath, getIdFromProfile, getUserDataFromProfile)
  return (accessToken: string, refreshToken: string, _extraParams: ExtraVerificationParams, profile: Auth0Profile, done: VerifyCallback) => {
    return standardHandler(accessToken, refreshToken, profile, done)
  }
}

/**
 * If the user's email has been updated by their OAuth provider, change their
 * email to match their OAuth provider's given email
 */
async function syncOAuthUser(user: DbUser, profile: Profile): Promise<DbUser> {
  if (!profile.emails || !profile.emails.length) {
    return user
  }
  // I'm unable to find documenation of how to interpret the emails object. It's
  // plausible we should always set the users email to the first one, but it
  // could be that the ordering doesn't matter, in which case we'd want to avoid
  // spuriously updating the user's email based on whichever one happened to be
  // first. But if their email is entirely missing, we should update it to be
  // one given by their OAuth provider. Probably their OAuth provider will only
  // ever report one email, in which case this is over-thought.
  const profileEmails = profile.emails.map(emailObj => emailObj.value)
  if (!profileEmails.includes(user.email)) {
    // Attempt to update the email field on the account to match the OAuth-provided
    // email. This will fail if the user has both an OAuth and a non-OAuth account
    // with the same email.
    const preexistingAccountWithEmail = await userFindOneByEmail(profileEmails[0]);
    if (!preexistingAccountWithEmail) {
      const updatedUserResponse = await updateMutator({
        collection: Users,
        documentId: user._id,
        set: {
          email: profileEmails[0],
          emails: [{address: profileEmails[0], verified: true}] //will overwrite other past emails which we don't actually want to support
        },
        validate: false
      })
      return updatedUserResponse.data
    }
  }
  return user
}

/**
 * Saves desired return path to session data for redirection upon authentication
 *
 * Assumes the request was made with a query, like /auth/google?returnTo=bar/baz
 *
 * Requires express-session to be enabled
 *
 * Sets an expiration - otherwise a stale returnTo could cause future
 * non-returnTo logins to erroneously redirect
 */
function saveReturnTo(req: any): void {
  if (!expressSessionSecretSetting.get()) return
  let { returnTo } = req.query
  if (!returnTo || !req.session) return
  
  req.session.loginReturnTo = {
    path: returnTo,
    // Enough time to login, even if you have to go looking for your password.
    // If you take longer than that, then hey, you probably forgot what you were
    // doing anyway.
    expiration: moment().add(30, 'minutes').toISOString()
  }
}

/**
 * Gets desired return path from session data
 *
 * Assumes that the initial request was made with a returnTo query parameter
 */
function getReturnTo(req: any): string {
  if (!expressSessionSecretSetting.get() || !req.session?.loginReturnTo) return '/'
  if (moment(req.session.loginReturnTo.expiration) < moment()) return '/'
  return req.session.loginReturnTo.path
}

const cookieAuthStrategy = new CustomStrategy(async function getUserPassport(req: any, done) {
  const loginToken = getCookieFromReq(req, 'loginToken') || getCookieFromReq(req, 'meteor_login_token') // Backwards compatibility with meteor_login_token here
  if (!loginToken) {
    return done(null, false)
  }
  const user = await getUser(loginToken)
  if (!user) {
    return done(null, false)
  }
  done(null, user)
})

/**
 * Creates a custom strategy which allows third-party API clients to log in via Auth0
 */
function createAccessTokenStrategy(auth0Strategy: AnyBecauseTodo) {
  const accessTokenUserHandler = createOAuthUserHandler('services.auth0', profile => profile.id, userFromAuth0Profile)

  return new CustomStrategy((req, done) => {
    const accessToken = req.query['access_token']
    const resumeToken = "" // not used
    if (typeof(accessToken) !== 'string') {
      return done("Invalid token")
    } else {
      auth0Strategy.userProfile(accessToken, (err: AnyBecauseTodo, profile: AnyBecauseTodo) => {
        if (profile) {
          void accessTokenUserHandler(accessToken, resumeToken, profile, done)
        } else {
          return done("Invalid token")
        }
      })
    }
  })
}

async function deserializeUserPassport(id: AnyBecauseTodo, done: AnyBecauseTodo) {
  const user = await Users.findOne({_id: id})
  if (!user) done()
  done(null, user)
}

passport.serializeUser((user, done) => done(null, user._id))
passport.deserializeUser(deserializeUserPassport)

export const addAuthMiddlewares = (addConnectHandler: AnyBecauseTodo) => {
  addConnectHandler(passport.initialize())
  passport.use(cookieAuthStrategy)
  
  addConnectHandler('/', (req: AnyBecauseTodo, res: AnyBecauseTodo, next: AnyBecauseTodo) => {
    passport.authenticate('custom', (err, user, info) => {
      if (err) return next(err)
      if (!user) return next()
      req.logIn(user, (err: AnyBecauseTodo) => {
        if (err) return next(err)
        next()
      })
    })(req, res, next) 
  })

  addConnectHandler('/logout', (req: AnyBecauseTodo, res: AnyBecauseTodo, next: AnyBecauseTodo) => {
    passport.authenticate('custom', (err, user, info) => {
      if (err) return next(err)
      req.logOut()

      // Remove session cookies
      const cookieUpdates = ['meteor_login_token', 'loginToken', 'connect.sid']
        .filter(cookieName => getCookieFromReq(req, cookieName))
        // The accepted way to delete a cookie is to set an expiration date in the past.
        .map(cookieName => `${cookieName}= ; expires=${new Date(0).toUTCString()}`)
      if (cookieUpdates.length) {
        // We need to set all Set-Cookie headers at once, or we'd overwrite the
        // previous ones. The way to set multiple Set-Cookie headers is to set
        // it with an array.
        // https://nodejs.org/api/http.html#http_request_setheader_name_value
        res.setHeader('Set-Cookie', cookieUpdates)
      }
      
      res.statusCode=302;
      // Need to log the user out of their Auth0 account. Otherwise when they
      // next try to login they won't be given a choice, just auto-resumed to
      // the same Auth0 account.
      if (auth0DomainSetting.get() && auth0ClientIdSetting.get() && isEAForum) {
        // Will redirect to our homepage, and is a noop if they're not logged in
        // to an Auth0 account, so this is very non-disruptive
        const returnUrl = encodeURIComponent(siteUrlSetting.get());
        res.setHeader('Location', `https://${auth0DomainSetting.get()}/v2/logout?client_id=${auth0ClientIdSetting.get()}&returnTo=${returnUrl}`);
      } else {
        res.setHeader('Location', '/');
      }
      return res.end();
    })(req, res, next);
  })

  const googleClientId =  googleClientIdSetting.get()
  const googleOAuthSecret = googleOAuthSecretSetting.get()
  if (googleClientId && googleOAuthSecret) {
    passport.use(
      new GoogleOAuthStrategy({
        clientID: googleClientId,
        clientSecret: googleOAuthSecret,
        callbackURL: `${getSiteUrl()}auth/google/callback`,
        proxy: true
      },
      createOAuthUserHandler<GoogleProfile>('services.google', profile => profile.id, async profile => ({
        services: {
          google: profile
        },
        email: profile.emails?.[0].value,
        emails: profile.emails?.[0].value ? [{address: profile.emails?.[0].value, verified: true}] : [],
        username: await Utils.getUnusedSlugByCollectionName("Users", slugify(profile.displayName)),
        displayName: profile.displayName,
        emailSubscribedToCurated: true
        // Type assertion here is because @types/passport-google-oauth20 doesn't
        // think their verify callback is able to take a null in the place of the
        // error, which seems like a bug and which prevents are seemingly working
        // code from type-checking
      })) as (_accessToken: string, _refreshToken: string, profile: GoogleProfile, done: GoogleVerifyCallback) => Promise<void>
      )
    )
  }
  
  const facebookClientId = facebookClientIdSetting.get()
  const facebookOAuthSecret = facebookOAuthSecretSetting.get()
  if (facebookClientId && facebookOAuthSecret) {
    passport.use(
      new FacebookOAuthStrategy({
        clientID: facebookClientId,
        clientSecret: facebookOAuthSecret,
        callbackURL: `${getSiteUrl()}auth/facebook/callback`,
        profileFields: ['id', 'emails', 'name', 'displayName'],
      },
      createOAuthUserHandler<FacebookProfile>('services.facebook', profile => profile.id, async profile => ({
        email: profile.emails?.[0].value,
        emails: profile.emails?.[0].value ? [{address: profile.emails?.[0].value, verified: true}] : [],
        services: {
          facebook: profile
        },
        username: await Utils.getUnusedSlugByCollectionName("Users", slugify(profile.displayName)),
        displayName: profile.displayName,
        emailSubscribedToCurated: true
      }))
    ))
  }

  const githubClientId = githubClientIdSetting.get()
  const githubOAuthSecret = githubOAuthSecretSetting.get()
  if (githubClientId && githubOAuthSecret) {
    passport.use(new GithubOAuthStrategy({
      clientID: githubClientId,
      clientSecret: githubOAuthSecret,
      callbackURL: `${getSiteUrl()}auth/github/callback`,
      scope: [ 'user:email' ], // fetches non-public emails as well
    },
      createOAuthUserHandler<GithubProfile>('services.github', profile => parseInt(profile.id), async profile => ({
        email: profile.emails?.[0].value,
        emails: profile.emails?.[0].value ? [{address: profile.emails?.[0].value, verified: true}] : [],
        services: {
          github: profile
        },
        username: await Utils.getUnusedSlugByCollectionName("Users", slugify(profile.username || profile.displayName)),
        displayName: profile.username || profile.displayName,
        emailSubscribedToCurated: true
      }))
    ));
  }
  
  const handleAuthenticate = (req: AnyBecauseTodo, res: AnyBecauseTodo, next: AnyBecauseTodo, err: AnyBecauseTodo, user: AnyBecauseTodo, info: AnyBecauseTodo) => {
    if (err) {
      if (err.message === "banned") {
        res.redirect(301, '/banNotice');
        return res.end();
      } else {
        return next(err)
      }
    }
    if (req.query?.error) {
      const { error, error_description} = req.query
      return next(new Error(`${error}: ${error_description}`))
    }
    if (!user) return next()
    req.logIn(user, async (err: AnyBecauseTodo) => {
      if (err) return next(err)
      await createAndSetToken(req, res, user)
      
      const returnTo = getReturnTo(req)
      res.statusCode=302;
      res.setHeader('Location', returnTo)
      return res.end();
    })
  }
  

  // NB: You must also set the expressSessionSecret setting in your database
  // settings - auth0 passport strategy relies on express-session to store state
  const auth0ClientId = auth0ClientIdSetting.get();
  const auth0OAuthSecret = auth0OAuthSecretSetting.get()
  const auth0Domain = auth0DomainSetting.get()
  if (auth0ClientId && auth0OAuthSecret && auth0Domain) {
    const auth0Strategy = new Auth0StrategyFixed(
      {
        clientID: auth0ClientId,
        clientSecret: auth0OAuthSecret,
        domain: auth0Domain,
        callbackURL: combineUrls(getSiteUrl(), 'auth/auth0/callback')
      },
      createOAuthUserHandlerAuth0('services.auth0', profile => profile.id, userFromAuth0Profile)
    )
    passport.use(auth0Strategy)

    passport.use('access_token', createAccessTokenStrategy(auth0Strategy))

    addConnectHandler('/auth/useAccessToken', (req: AnyBecauseTodo, res: AnyBecauseTodo, next: AnyBecauseTodo) => {
      passport.authenticate('access_token', {}, (err, user, info) => {
        handleAuthenticate(req, res, next, err, user, info)
      })(req, res, next)
    })
  }

  addConnectHandler('/auth/google/callback', (req: AnyBecauseTodo, res: AnyBecauseTodo, next: AnyBecauseTodo) => {
    passport.authenticate('google', {}, (err, user, info) => {
      handleAuthenticate(req, res, next, err, user, info);
    })(req, res, next)
  })

  addConnectHandler('/auth/google', (req: AnyBecauseTodo, res: AnyBecauseTodo, next: AnyBecauseTodo) => {
    saveReturnTo(req)
    passport.authenticate('google', {
      scope: [
        'https://www.googleapis.com/auth/plus.login',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      accessType: "offline",
      prompt: "select_account consent",
    })(req, res, next)
  })

  addConnectHandler('/auth/facebook/callback', (req: AnyBecauseTodo, res: AnyBecauseTodo, next: AnyBecauseTodo) => {
    passport.authenticate('facebook', {}, (err, user, info) => {
      handleAuthenticate(req, res, next, err, user, info);
    })(req, res, next)
  })

  addConnectHandler('/auth/facebook', (req: AnyBecauseTodo, res: AnyBecauseTodo, next: AnyBecauseTodo) => {
    saveReturnTo(req)
    passport.authenticate('facebook')(req, res, next)
  })

  addConnectHandler('/auth/auth0/callback', (req: AnyBecauseTodo, res: AnyBecauseTodo, next: AnyBecauseTodo) => {
    passport.authenticate('auth0', (err, user, info) => {
      handleAuthenticate(req, res, next, err, user, info)
    })(req, res, next)
  })

  addConnectHandler('/auth/auth0', (req: AnyBecauseTodo, res: AnyBecauseTodo, next: AnyBecauseTodo) => {
    const extraParams = pick(req.query, ['screen_hint', 'prompt'])
    saveReturnTo(req)
    
    passport.authenticate('auth0', {
      scope: 'profile email openid offline_access',
      ...extraParams
    } as AuthenticateOptions)(req, res, next)
  })

  addConnectHandler('/auth/github/callback', (req: AnyBecauseTodo, res: AnyBecauseTodo, next: AnyBecauseTodo) => {
    passport.authenticate('github', {}, (err, user, info) => {
      handleAuthenticate(req, res, next, err, user, info);
    })(req, res, next)
  })

  addConnectHandler('/auth/github', (req: AnyBecauseTodo, res: AnyBecauseTodo, next: AnyBecauseTodo) => {
    saveReturnTo(req)
    passport.authenticate('github', { scope: ['user:email']})(req, res, next)
  })
}
