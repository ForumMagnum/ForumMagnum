import passport, { Profile } from 'passport'
import { createAndSetToken } from './vulcan-lib/apollo-server/authentication';
import { Strategy as CustomStrategy } from 'passport-custom'
import { getUser } from './vulcan-lib/apollo-server/context';
import { Users } from '../server/collections/users/collection';
import { getCookieFromReq } from './utils/httpUtil';
import { Strategy as GoogleOAuthStrategy, Profile as GoogleProfile, VerifyCallback as GoogleVerifyCallback } from 'passport-google-oauth20';
import { Strategy as FacebookOAuthStrategy, Profile as FacebookProfile } from 'passport-facebook';
import { Strategy as GithubOAuthStrategy, Profile as GithubProfile } from 'passport-github2';
import { Strategy as Auth0Strategy, Profile as Auth0Profile, ExtraVerificationParams, AuthenticateOptions } from 'passport-auth0';
import { VerifyCallback } from 'passport-oauth2'
import { afGithubClientIdSetting, afGithubOAuthSecretSetting, auth0ClientIdSetting, auth0DomainSetting, DatabaseServerSetting, githubClientIdSetting, githubOAuthSecretSetting, googleClientIdSetting, googleOAuthSecretSetting } from './databaseSettings';
import { combineUrls, getSiteUrl } from '../lib/vulcan-lib/utils';
import pick from 'lodash/pick';
import { isAF, isEAForum, siteUrlSetting } from '../lib/instanceSettings';
import { auth0ProfilePath, idFromAuth0Profile, userFromAuth0Profile } from './authentication/auth0Accounts';
import moment from 'moment';
import type { AddMiddlewareType } from './apolloServer';
import { Request, Response, NextFunction, json } from "express";
import { AUTH0_SCOPE, ProfileFromAccessToken, loginAuth0User, signupAuth0User } from './authentication/auth0';
import { IdFromProfile, UserDataFromProfile, getOrCreateForumUser } from './authentication/getOrCreateForumUser';
import { promisify } from 'util';
import { OAuth2Client as GoogleOAuth2Client } from 'google-auth-library';
import { oauth2 } from '@googleapis/oauth2';
import { googleDocImportClientIdSetting, googleDocImportClientSecretSetting, updateActiveServiceAccount } from './posts/googleDocImport';
import { userIsAdmin } from '../lib/vulcan-users/permissions';
import { isE2E } from '../lib/executionEnvironment';
import { getUnusedSlugByCollectionName } from './utils/slugUtil';
import { slugify } from '@/lib/utils/slugify';
import { prepareClientId } from './clientIdMiddleware';
import { getAuth0Credentials, hasAuth0 } from "./databaseSettings";

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
  userProfile!: (accessToken: string, done: (err: Error | null, profile?: Auth0Profile) => void) => void;
}

const facebookClientIdSetting = new DatabaseServerSetting<string | null>('oAuth.facebook.appId', null)
const facebookOAuthSecretSetting = new DatabaseServerSetting<string | null>('oAuth.facebook.secret', null)

export const expressSessionSecretSetting = new DatabaseServerSetting<string | null>('expressSessionSecret', null)


/**
 * Given the provider-appropriate ways to get user info from a profile, create
 * a function that handles successful logins from that provider
 */
function createOAuthUserHandler<P extends Profile>(profilePath: string, getIdFromProfile: IdFromProfile<P>, getUserDataFromProfile: UserDataFromProfile<P>) {
  return async (_accessToken: string, _refreshToken: string, profile: P, done: VerifyCallback) => {
    return getOrCreateForumUser(
      profilePath,
      profile,
      getIdFromProfile,
      getUserDataFromProfile,
      done,
    );
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

function getLoginTokenFromReq(req: Request): string|null {
  return getCookieFromReq(req, 'loginToken') || getCookieFromReq(req, 'meteor_login_token') // Backwards compatibility with meteor_login_token here
}

const cookieAuthStrategy = new CustomStrategy(async function getUserPassport(req: Request, done) {
  const loginToken = getLoginTokenFromReq(req);

  // Get the user from their login token, if they have one. In parallel with
  // this, look up their client ID, if they have one, and monkeypatch related
  // information onto the request. This is an awkward place for this, but it has
  // to be here so that it can run in parallel with the query to get the user.
  const [user, _] = await Promise.all([
    getUser(loginToken),
    prepareClientId(req)
  ]);

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
      auth0Strategy.userProfile(accessToken, (_err: AnyBecauseTodo, profile: AnyBecauseTodo) => {
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


/**
 * Add routes for handling linking the service account required to import google docs
 */
const addGoogleDriveLinkMiddleware = (addConnectHandler: AddMiddlewareType) => {
  const googleClientId = googleDocImportClientIdSetting.get();
  const googleOAuthSecret = googleDocImportClientSecretSetting.get()

  if (!googleClientId || !googleOAuthSecret) {
    return;
  }

  const callbackUrl = "google_oauth2callback"
  const oauth2Client = new GoogleOAuth2Client(googleClientId, googleOAuthSecret, combineUrls(getSiteUrl(), callbackUrl));

  addConnectHandler('/auth/linkgdrive', (req: Request, res: Response) => {
    if (!req.user?._id || !userIsAdmin(req.user)) {
      res.status(400).send("User is not authenticated or not an admin");
      return;
    }

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline', // offline => get a refresh token that persists for 6 months
      scope: [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      redirect_uri: combineUrls(getSiteUrl(), callbackUrl)
    });
    res.redirect(url);
  });

  addConnectHandler(`/${callbackUrl}`, async (req: Request, res: Response) => {
    const code = req.query.code as string;
    const user = req.user

    if (!user?._id || !userIsAdmin(user)) {
      res.status(400).send("User is not authenticated or not an admin");
      return;
    }

    try {
      const { tokens } = await oauth2Client.getToken(code);

      if (!tokens.refresh_token) {
        throw new Error("Failed to create refresh_token")
      }

      oauth2Client.setCredentials(tokens);

      const userInfo = await oauth2({
        auth: oauth2Client,
        version: 'v2'
      }).userinfo.get();

      const email = userInfo?.data?.email

      if (!email) {
        throw new Error("Failed to get email")
      }

      await updateActiveServiceAccount({
        email,
        refreshToken: tokens.refresh_token
      })

      res.redirect('/admin/googleServiceAccount');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error retrieving access token', error);
      res.redirect('/admin/googleServiceAccount');
    }
  });
};

const handleAuthenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
  err: AnyBecauseTodo,
  user: DbUser | null | undefined,
  _info: AnyBecauseTodo,
) => {
  if (err) {
    if (err.message === "banned") {
      res.redirect(301, '/banNotice');
      return res.end();
    } else {
      return next(err);
    }
  }
  if (req.query?.error) {
    const { error, error_description} = req.query;
    return next(new Error(`${error}: ${error_description}`));
  }
  if (!user) {
    return next();
  }
  req.logIn(user, async (err: AnyBecauseTodo) => {
    if (err) {
      return next(err);
    }
    await createAndSetToken(req, user);

    const returnTo = getReturnTo(req);
    res.statusCode = 302;
    res.setHeader('Location', returnTo);
    return res.end();
  });
}

const addAuth0Strategy = (
  addConnectHandler: AddMiddlewareType,
  auth0ClientId: string,
  auth0OAuthSecret: string,
  auth0Domain: string,
): ProfileFromAccessToken => {
  const auth0Strategy = new Auth0StrategyFixed(
    {
      clientID: auth0ClientId,
      clientSecret: auth0OAuthSecret,
      domain: auth0Domain,
      callbackURL: combineUrls(getSiteUrl(), 'auth/auth0/callback')
    },
    createOAuthUserHandlerAuth0(
      auth0ProfilePath,
      idFromAuth0Profile,
      userFromAuth0Profile,
    ),
  );
  passport.use(auth0Strategy);

  passport.use('access_token', createAccessTokenStrategy(auth0Strategy));

  addConnectHandler('/auth/useAccessToken', (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('access_token', {}, (err, user, info) => {
      handleAuthenticate(req, res, next, err, user, info)
    })(req, res, next);
  });

  return promisify(auth0Strategy.userProfile.bind(auth0Strategy));
}

const mockProfileFromAccessToken: ProfileFromAccessToken = async (token: string) => {
  if (!isE2E) {
    throw new Error("Using mock auth0 backend outside of E2E tests");
  }
  const email = token.replace("access-token-", "");
  return {
    provider: "auth0",
    id: email,
    displayName: email,
    emails: [{value: email}],
    birthday: "",
    _raw: email,
    _json: {},
  }
}

const addEmbeddedAuth0Handlers = (
  addConnectHandler: AddMiddlewareType,
  profileFromAccessToken: ProfileFromAccessToken,
) => {
  addConnectHandler("/auth/auth0/embedded-login", json({limit: "1mb"}));
  addConnectHandler("/auth/auth0/embedded-login", async (req: Request, res: Response) => {
    const errorHandler: NextFunction = (err) => {
      if (err) {
        res.status(400).send({
          error: err.message,
          policy: err.policy,
        });
      }
    }
    try {
      const {email, password} = req.body;
      if (!email || typeof email !== "string") {
        throw new Error("Email is required");
      }
      if (!password || typeof password !== "string") {
        throw new Error("Password is required");
      }
      const {user} = await loginAuth0User(profileFromAccessToken, email, password);
      handleAuthenticate(req, res, errorHandler, null, user, null);
    } catch (e) {
      errorHandler(e);
    }
  });

  addConnectHandler("/auth/auth0/embedded-signup", json({limit: "1mb"}));
  addConnectHandler("/auth/auth0/embedded-signup", async (req: Request, res: Response) => {
    const errorHandler: NextFunction = (err) => {
      if (err) {
        res.status(400).send({
          error: err.message,
          policy: err.policy,
        });
      }
    }
    try {
      const {email, password} = req.body;
      if (!email || typeof email !== "string") {
        throw new Error("Email is required");
      }
      if (!password || typeof password !== "string") {
        throw new Error("Password is required");
      }
      const {user} = await signupAuth0User(profileFromAccessToken, email, password);
      handleAuthenticate(req, res, errorHandler, null, user, null);
    } catch (e) {
      errorHandler(e);
    }
  });
}

passport.serializeUser((user, done) => done(null, user._id))
passport.deserializeUser(deserializeUserPassport)

export const addAuthMiddlewares = (addConnectHandler: AddMiddlewareType) => {
  addConnectHandler(passport.initialize())
  passport.use(cookieAuthStrategy)

  addConnectHandler('/', (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('custom', (err, user, _info) => {
      if (err) return next(err)
      if (!user) return next()
      req.logIn(user, (err: AnyBecauseTodo) => {
        if (err) return next(err)
        next()
      })
    })(req, res, next) 
  })

  addConnectHandler('/logout', (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('custom', (err, _user, _info) => {
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
        username: await getUnusedSlugByCollectionName("Users", slugify(profile.displayName)),
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
        username: await getUnusedSlugByCollectionName("Users", slugify(profile.displayName)),
        displayName: profile.displayName,
        emailSubscribedToCurated: true
      }))
    ))
  }

  const githubClientId = isAF ? afGithubClientIdSetting.get() : githubClientIdSetting.get()
  const githubOAuthSecret = isAF ? afGithubOAuthSecretSetting.get() : githubOAuthSecretSetting.get()
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
        username: await getUnusedSlugByCollectionName("Users", slugify(profile.username || profile.displayName)),
        displayName: profile.username || profile.displayName,
        emailSubscribedToCurated: true
      }))
    ));
  }

  // NB: You must also set the expressSessionSecret setting in your database
  // settings - auth0 passport strategy relies on express-session to store state
  const { auth0ClientId, auth0OAuthSecret, auth0Domain } = getAuth0Credentials();

  // NB: You must also set the expressSessionSecret setting in your database
  // settings - auth0 passport strategy relies on express-session to store state
  const profileFromAccessToken = hasAuth0()
    ? addAuth0Strategy(addConnectHandler, auth0ClientId!, auth0OAuthSecret!, auth0Domain!)
    : mockProfileFromAccessToken;
  if (hasAuth0() || isE2E) {
    addEmbeddedAuth0Handlers(addConnectHandler, profileFromAccessToken);
  }

  addConnectHandler('/auth/google/callback', (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('google', {}, (err, user, info) => {
      handleAuthenticate(req, res, next, err, user, info);
    })(req, res, next)
  })

  addConnectHandler('/auth/google', (req: Request, res: Response, next: NextFunction) => {
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

  addConnectHandler('/auth/facebook/callback', (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('facebook', {}, (err, user, info) => {
      handleAuthenticate(req, res, next, err, user, info);
    })(req, res, next)
  })

  addConnectHandler('/auth/facebook', (req: Request, res: Response, next: NextFunction) => {
    saveReturnTo(req)
    passport.authenticate('facebook')(req, res, next)
  })

  addConnectHandler('/auth/auth0/callback', (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('auth0', (err, user, info) => {
      handleAuthenticate(req, res, next, err, user, info)
    })(req, res, next)
  })

  addConnectHandler('/auth/auth0', (req: Request, res: Response, next: NextFunction) => {
    const extraParams = pick(req.query, ['screen_hint', 'prompt', 'connection'])
    saveReturnTo(req)

    passport.authenticate('auth0', {
      scope: AUTH0_SCOPE,
      ...extraParams
    } as AuthenticateOptions)(req, res, next)
  })

  addConnectHandler('/auth/github/callback', (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('github', {}, (err, user, info) => {
      handleAuthenticate(req, res, next, err, user, info);
    })(req, res, next)
  })

  addConnectHandler('/auth/github', (req: Request, res: Response, next: NextFunction) => {
    saveReturnTo(req)
    passport.authenticate('github', { scope: ['user:email']})(req, res, next)
  })

  addGoogleDriveLinkMiddleware(addConnectHandler)
}
