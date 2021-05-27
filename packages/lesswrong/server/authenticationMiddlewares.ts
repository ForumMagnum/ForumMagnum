import passport from 'passport'
import { createAndSetToken } from './vulcan-lib/apollo-server/authentication';
import { Strategy as CustomStrategy } from 'passport-custom'
import { getUser } from './vulcan-lib/apollo-server/context';
import { Users } from '../lib/collections/users/collection';
import { getCookieFromReq } from './utils/httpUtil';
import { Strategy as GoogleOAuthStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookOAuthStrategy } from 'passport-facebook';
import { Strategy as GithubOAuthStrategy } from 'passport-github2';
import { DatabaseServerSetting } from './databaseSettings';
import { createMutator } from './vulcan-lib/mutators';
import { getSiteUrl, slugify, Utils } from '../lib/vulcan-lib/utils';

const googleClientIdSetting = new DatabaseServerSetting('oAuth.google.clientId', null)
const googleOAuthSecretSetting = new DatabaseServerSetting('oAuth.google.secret', null)

const facebookClientIdSetting = new DatabaseServerSetting('oAuth.facebook.appId', null)
const facebookOAuthSecretSetting = new DatabaseServerSetting('oAuth.facebook.secret', null)

const githubClientIdSetting = new DatabaseServerSetting('oAuth.github.clientId', null)
const githubOAuthSecretSetting = new DatabaseServerSetting('oAuth.github.secret', null)

function createOAuthUserHandler(idPath, getIdFromProfile, getUserDataFromProfile) {
  return async (accessToken, refreshToken, profile, done) => {
    const user = await Users.findOne({[idPath]: getIdFromProfile(profile)})
    if (!user) {
      const { data: user } = await createMutator({
        collection: Users,
        document: await getUserDataFromProfile(profile),
        validate: false,
        currentUser: null
      })
      return done(null, user)
    }
    if (user.banned && new Date(user.banned) > new Date()) {
      return done("banned", null)
    }
    return done(null, user)
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

// TODO: Passport annotates this a taking an Express.User, which doesn't have an _id.
// But this seems to work with this (and other functions) assuming a DbUser. Marked
// as 'any' to suppress the type error.
passport.serializeUser((user: any, done) => done(null, user._id))
passport.deserializeUser(deserializeUserPassport)


export const addAuthMiddlewares = (addConnectHandler) => {
  addConnectHandler(passport.initialize())
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

  //EAFORUM LOOK HERE - Figure out what to do with your oAuth strategies
  const googleClientId =  googleClientIdSetting.get()
  const googleOAuthSecret = googleOAuthSecretSetting.get()
  if (googleClientId && googleOAuthSecret) {
    passport.use(new GoogleOAuthStrategy({
      clientID: googleClientId,
      clientSecret: googleOAuthSecret,
      callbackURL: `${getSiteUrl()}auth/google/callback`,
      proxy: true
    },
    createOAuthUserHandler('services.google.id', profile => profile.id, async profile => ({
      email: profile.emails[0].address,
      services: {
        google: profile
      },
      emails: [{address: profile.emails[0].address, verified: true}],
      username: await Utils.getUnusedSlugByCollectionName("Users", slugify(profile.displayName)),
      displayName: profile.displayName,
      emailSubscribedToCurated: true
    }))
  ))}
  
  const facebookClientId = facebookClientIdSetting.get()
  if (facebookClientId) {
    passport.use(new FacebookOAuthStrategy({
      clientID: facebookClientId,
      clientSecret: facebookOAuthSecretSetting.get(),
      callbackURL: `${getSiteUrl()}auth/facebook/callback`,
      profileFields: ['id', 'emails', 'name', 'displayName'],
      proxy: true
    },
      createOAuthUserHandler('services.facebook.id', profile => profile.id, async profile => ({
        email: profile.emails[0].value,
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
  if (githubClientId) {
    passport.use(new GithubOAuthStrategy({
      clientID: githubClientId,
      clientSecret: githubOAuthSecretSetting.get(),
      callbackURL: `${getSiteUrl()}auth/github/callback`,
      scope: [ 'user:email' ], // fetches non-public emails as well
    },
      createOAuthUserHandler('services.github.id', profile => parseInt(profile.id), async profile => ({
        email: profile.emails[0].value,
        services: {
          github: profile
        },
        username: await Utils.getUnusedSlugByCollectionName("Users", slugify(profile.username)),
        displayName: profile.username || profile.displayName,
        emailSubscribedToCurated: true
      }))
    ));
  }
  
  const handleAuthenticate = (req, res, next, err, user, info) => { //ea-forum-lookhere
    if (err) {
      if (err=="banned") {
        res.redirect(301, '/banNotice');
        return res.end();
      } else {
        return next(err)
      }
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
  
  addConnectHandler('/auth/google/callback', (req, res, next) => {
    passport.authenticate('google', {}, (err, user, info) => {
      handleAuthenticate(req, res, next, err, user, info);
    })(req, res, next)
  })

  addConnectHandler('/auth/google', (req, res, next) => {
    passport.authenticate('google', {scope: ['https://www.googleapis.com/auth/plus.login', 'https://www.googleapis.com/auth/userinfo.email'], accessType: "offline", prompt: "consent"})(req, res, next)
  })

  addConnectHandler('/auth/facebook/callback', (req, res, next) => {
    passport.authenticate('facebook', {}, (err, user, info) => {
      handleAuthenticate(req, res, next, err, user, info);
    })(req, res, next)
  })

  addConnectHandler('/auth/facebook', (req, res, next) => {
    passport.authenticate('facebook')(req, res, next)
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
