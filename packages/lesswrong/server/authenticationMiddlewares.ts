import passport, { Profile } from 'passport'
import { createAndSetToken } from './vulcan-lib/apollo-server/authentication';
import { Strategy as CustomStrategy } from 'passport-custom'
import { getUser } from './vulcan-lib/apollo-server/context';
import { Users } from '../lib/collections/users/collection';
import { getCookieFromReq } from './utils/httpUtil';
import { Strategy as GoogleOAuthStrategy, Profile as GoogleProfile, VerifyCallback as GoogleVerifyCallback } from 'passport-google-oauth20';
import { Strategy as FacebookOAuthStrategy, Profile as FacebookProfile } from 'passport-facebook';
import { Strategy as GithubOAuthStrategy, Profile as GithubProfile } from 'passport-github2';
import { Strategy as Auth0Strategy, Profile as Auth0Profile, ExtraVerificationParams } from 'passport-auth0';
import { VerifyCallback } from 'passport-oauth2'
import { DatabaseServerSetting } from './databaseSettings';
import { createMutator } from './vulcan-lib/mutators';
import { combineUrls, getSiteUrl, slugify, Utils } from '../lib/vulcan-lib/utils';

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

const googleClientIdSetting = new DatabaseServerSetting<string | null>('oAuth.google.clientId', null)
const googleOAuthSecretSetting = new DatabaseServerSetting<string | null>('oAuth.google.secret', null)

const auth0ClientIdSetting = new DatabaseServerSetting<string | null>('oAuth.auth0.appId', null)
const auth0OAuthSecretSetting = new DatabaseServerSetting<string | null>('oAuth.auth0.secret', null)
const auth0DomainSetting = new DatabaseServerSetting<string | null>('oAuth.auth0.domain', null)

const facebookClientIdSetting = new DatabaseServerSetting<string | null>('oAuth.facebook.appId', null)
const facebookOAuthSecretSetting = new DatabaseServerSetting<string | null>('oAuth.facebook.secret', null)

const githubClientIdSetting = new DatabaseServerSetting<string | null>('oAuth.github.clientId', null)
const githubOAuthSecretSetting = new DatabaseServerSetting<string | null>('oAuth.github.secret', null)

type IdFromProfile<P extends Profile> = (profile: P) => string | number
type UserDataFromProfile<P extends Profile> = (profile: P) => Promise<Partial<DbUser>>

/**
 * Given the provider-appropriate ways to get user info from a profile, create
 * a function that handles successful logins from that provider
 */
function createOAuthUserHandler<P extends Profile>(idPath: string, getIdFromProfile: IdFromProfile<P>, getUserDataFromProfile: UserDataFromProfile<P>) {
  return async (_accessToken: string, _refreshToken: string, profile: P, done: VerifyCallback) => {
    const profileId = getIdFromProfile(profile)
    // Probably impossible, but if it is null, we just log the person in as a
    // random user, which is bad, so we'll check anyway.
    if (!profileId) {
      throw new Error('OAuth profile does not have a profile ID')
    }
    const user = await Users.findOne({[idPath]: profileId})
    if (!user) {
      const { data: userCreated } = await createMutator({
        collection: Users,
        document: await getUserDataFromProfile(profile),
        validate: false,
        currentUser: null
      })
      return done(null, userCreated)
    }
    if (user.banned && new Date(user.banned) > new Date()) {
      return done(new Error("banned"))
    }
    return done(null, user)
  }
}

/**
 * Auth0 passes 5 parameters, not 4, so we need to wrap createOAuthUserHandler
 */
function createOAuthUserHandlerAuth0(idPath: string, getIdFromProfile: IdFromProfile<Auth0Profile>, getUserDataFromProfile: UserDataFromProfile<Auth0Profile>) {
  const standardHandler = createOAuthUserHandler(idPath, getIdFromProfile, getUserDataFromProfile)
  return (accessToken: string, refreshToken: string, _extraParams: ExtraVerificationParams, profile: Auth0Profile, done: VerifyCallback) => {
    return standardHandler(accessToken, refreshToken, profile, done)
  }
}

const cookieAuthStrategy = new CustomStrategy(async function getUserPassport(req: any, done) {
  const loginToken = getCookieFromReq(req, 'loginToken') || getCookieFromReq(req, 'meteor_login_token') // Backwards compatibility with meteor_login_token here
  if (!loginToken) return done(null, false)
  const user = await getUser(loginToken)
  if (!user) return done(null, false)
  done(null, user)
})

async function deserializeUserPassport(id, done) {
  const user = await Users.findOne({_id: id})
  if (!user) done()
  done(null, user)
}

passport.serializeUser((user, done) => done(null, user._id))
passport.deserializeUser(deserializeUserPassport)


export const addAuthMiddlewares = (addConnectHandler) => {
  addConnectHandler(passport.initialize())
  addConnectHandler(passport.session())
  passport.use(cookieAuthStrategy)
  
  addConnectHandler('/', (req, res, next) => {
    passport.authenticate('custom', (err, user, info) => {
      if (err) return next(err)
      if (!user) return next()
      req.logIn(user, (err) => {
        if (err) return next(err)
        next()
      })
    })(req, res, next) 
  })

  addConnectHandler('/logout', (req, res, next) => {
    passport.authenticate('custom', (err, user, info) => {
      if (err) return next(err)
      if (!user) return next()
      req.logOut()

      // The accepted way to delete a cookie is to set an expiration date in the past.
      if (getCookieFromReq(req, "meteor_login_token")) {
        res.setHeader("Set-Cookie", `meteor_login_token= ; expires=${new Date(0).toUTCString()};`)
      }
      if (getCookieFromReq(req, "loginToken")) {
        res.setHeader("Set-Cookie", `loginToken= ; expires=${new Date(0).toUTCString()};`)
      }
      
      
      res.statusCode=302;
      res.setHeader('Location','/');
      return res.end();
    })(req, res, next);
  })

  const googleClientId =  googleClientIdSetting.get()
  const googleOAuthSecret = googleOAuthSecretSetting.get()
  if (googleClientId && googleOAuthSecret) {
    passport.use(new GoogleOAuthStrategy({
      clientID: googleClientId,
      clientSecret: googleOAuthSecret,
      callbackURL: `${getSiteUrl()}auth/google/callback`,
      proxy: true
    },
    createOAuthUserHandler<GoogleProfile>('services.google.id', profile => profile.id, async profile => ({
      email: profile.emails?.[0].value,
      services: {
        google: profile
      },
      // todo;
      emails: [{address: profile.emails?.[0].value, verified: true}],
      username: await Utils.getUnusedSlugByCollectionName("Users", slugify(profile.displayName)),
      displayName: profile.displayName,
      emailSubscribedToCurated: true
      // Type assertion here is because @types/passport-google-oauth20 doesn't
      // think their verify callback is able to take a null in the place of the
      // error, which seems like a bug and which prevents are seemingly working
      // code from type-checking
    })) as (_accessToken: string, _refreshToken: string, profile: GoogleProfile, done: GoogleVerifyCallback) => Promise<void>
  ))}
  
  const facebookClientId = facebookClientIdSetting.get()
  const facebookOAuthSecret = facebookOAuthSecretSetting.get()
  if (facebookClientId && facebookOAuthSecret) {
    passport.use(new FacebookOAuthStrategy({
      clientID: facebookClientId,
      clientSecret: facebookOAuthSecret,
      callbackURL: `${getSiteUrl()}auth/facebook/callback`,
      profileFields: ['id', 'emails', 'name', 'displayName'],
    },
      createOAuthUserHandler<FacebookProfile>('services.facebook.id', profile => profile.id, async profile => ({
        email: profile.emails?.[0].value,
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
      createOAuthUserHandler<GithubProfile>('services.github.id', profile => parseInt(profile.id), async profile => ({
        email: profile.emails?.[0].value,
        services: {
          github: profile
        },
        username: await Utils.getUnusedSlugByCollectionName("Users", slugify(profile.username || profile.displayName)),
        displayName: profile.username || profile.displayName,
        emailSubscribedToCurated: true
      }))
    ));
  }
  
  const handleAuthenticate = (req, res, next, err, user, info) => {
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
    req.logIn(user, async (err) => {
      if (err) return next(err)
      await createAndSetToken(req, res, user)
      res.statusCode=302;
      res.setHeader('Location', '/')
      return res.end();
    })
  }
  

  // NB: You must also set the expressSessionSecret setting in your database
  // settings - auth0 passport strategy relies on express-session to store state
  const auth0ClientId = auth0ClientIdSetting.get();
  const auth0OAuthSecret = auth0OAuthSecretSetting.get()
  const auth0Domain = auth0DomainSetting.get()
  if (auth0ClientId && auth0OAuthSecret && auth0Domain) {
    passport.use(new Auth0Strategy(
      {
        clientID: auth0ClientId,
        clientSecret: auth0OAuthSecret,
        domain: auth0Domain,
        callbackURL: combineUrls(getSiteUrl(), 'auth/auth0/callback')
      },
      createOAuthUserHandlerAuth0('services.auth0.id', profile => profile.id, async profile => {
        // Already have the raw version, and the structured content. No need to store the json.
        delete profile._json
        return {
          email: profile.emails?.[0].value,
          services: {
            auth0: profile
          },
          username: await Utils.getUnusedSlugByCollectionName("Users", slugify(profile.displayName)),
          displayName: profile.displayName,
          emailSubscribedToCurated: true
        }
      })
    ));
  }

  addConnectHandler('/auth/google/callback', (req, res, next) => {
    passport.authenticate('google', {}, (err, user, info) => {
      handleAuthenticate(req, res, next, err, user, info);
    })(req, res, next)
  })

  addConnectHandler('/auth/google', (req, res, next) => {
    passport.authenticate('google', {
      scope: [
        'https://www.googleapis.com/auth/plus.login',
        'https://www.googleapis.com/auth/userinfo.email'
      ], accessType: "offline", prompt: "consent"
    })(req, res, next)
  })

  addConnectHandler('/auth/facebook/callback', (req, res, next) => {
    passport.authenticate('facebook', {}, (err, user, info) => {
      handleAuthenticate(req, res, next, err, user, info);
    })(req, res, next)
  })

  addConnectHandler('/auth/facebook', (req, res, next) => {
    passport.authenticate('facebook')(req, res, next)
  })

  addConnectHandler('/auth/auth0/callback', (req, res, next) => {
    passport.authenticate('auth0', (err, user, info) => {
      handleAuthenticate(req, res, next, err, user, info)
    })(req, res, next)
  })

  addConnectHandler('/auth/auth0', (req, res, next) => {
    passport.authenticate('auth0', { scope: 'profile email openid offline_access'})(req, res, next)
  })

  addConnectHandler('/auth/github/callback', (req, res, next) => {
    passport.authenticate('github', {}, (err, user, info) => {
      handleAuthenticate(req, res, next, err, user, info);
    })(req, res, next)
  })

  addConnectHandler('/auth/github', (req, res, next) => {
    passport.authenticate('github', { scope: ['user:email']})(req, res, next)
  })
}
