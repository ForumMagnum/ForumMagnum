import passport from 'passport'
import { createAndSetToken } from './vulcan-lib/apollo-server/authentication';
import { Strategy as CustomStrategy } from 'passport-custom'
import { getUser } from './vulcan-lib/apollo-server/context';
import { Users } from '../lib/collections/users/collection';

function getCookieFromReq(req, cookieName: string) {
  if (req.universalCookies)
    return req.universalCookies.get(cookieName);
  else if (req.cookies)
    return req.cookies[cookieName];
  else
    throw new Error("Tried to get a cookie but middleware not correctly configured");
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
