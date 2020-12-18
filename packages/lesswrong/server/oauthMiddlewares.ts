import passport from 'passport'
import { DatabaseServerSetting } from './databaseSettings';
import { createMutator, getSiteUrl, slugify, Utils } from './vulcan-lib';
import { createAndSetToken } from './vulcan-lib/apollo-server/authentication';
import { Strategy as GoogleOAuthStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookOAuthStrategy } from 'passport-facebook';
import { Strategy as GithubOAuthStrategy } from 'passport-github2';
import Users from '../lib/collections/users/collection';

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
        document: getUserDataFromProfile(profile),
        validate: false,
        currentUser: null
      })
      return done(null, user)
    }
    return done(null, user)
  }
}

export const addOauthMiddlewares = (addConnectHandler) => {
  //EAFORUM LOOK HERE - Figure out what to do with your oAuth strategies
  const googleClientId =  googleClientIdSetting.get()
  if (googleClientId) {
    passport.use(new GoogleOAuthStrategy({
      clientID: googleClientIdSetting.get(),
      clientSecret: googleOAuthSecretSetting.get(),
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
  ))}
  
  const facebookClientId = facebookClientIdSetting.get()
  if (facebookClientId) {
    passport.use(new FacebookOAuthStrategy({
      clientID: facebookClientIdSetting.get(),
      clientSecret: facebookOAuthSecretSetting.get(),
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
  }
  
  const githubClientId = githubClientIdSetting.get()
  if (githubClientId) {
    passport.use(new GithubOAuthStrategy({
      clientID: githubClientIdSetting.get(),
      clientSecret: githubOAuthSecretSetting.get(),
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
  }
  

  addConnectHandler('/auth/google/callback', (req, res, next) => {
    passport.authenticate('google', {}, (err, user, info) => {
      if (err) return next(err)
      if (!user) return next()
      req.logIn(user, async (err) => {
        if (err) return next(err)
        await createAndSetToken(req, res, user)
        res.statusCode=302;
        res.setHeader('Location', '/')
        return res.end();
      })
    })(req, res, next)
  } )

  addConnectHandler('/auth/google', (req, res, next) => {
    passport.authenticate('google', {scope: ['https://www.googleapis.com/auth/plus.login', 'https://www.googleapis.com/auth/userinfo.email'], accessType: "offline", prompt: "consent"})(req, res, next)
  })

  addConnectHandler('/auth/facebook/callback', (req, res, next) => {
    passport.authenticate('facebook', {}, (err, user, info) => {
      if (err) return next(err)
      if (!user) return next()
      req.logIn(user, async (err) => {
        if (err) return next(err)
        await createAndSetToken(req, res, user)
        res.statusCode=302;
        res.setHeader('Location', '/')
        return res.end();
      })
    })(req, res, next)
  } )

  addConnectHandler('/auth/facebook', (req, res, next) => {
    passport.authenticate('facebook')(req, res, next)
  })

  addConnectHandler('/auth/github/callback', (req, res, next) => {
    passport.authenticate('github', {}, (err, user, info) => {
      if (err) return next(err)
      if (!user) return next()
      req.logIn(user, async (err) => {
        if (err) return next(err)
        await createAndSetToken(req, res, user)
        res.statusCode=302;
        res.setHeader('Location', '/')
        return res.end();
      })
    })(req, res, next)
  } )

  addConnectHandler('/auth/github', (req, res, next) => {
    passport.authenticate('github', { scope: ['user:email']})(req, res, next)
  })
}
