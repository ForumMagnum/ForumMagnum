import { withRenderContextEnvironment, getSetting } from 'meteor/vulcan:lib';
import { verify, sign } from 'jsonwebtoken';
import deepmerge from 'deepmerge';

const SETTINGS_KEY = 'webtoken-session';

withRenderContextEnvironment(function (context, req, res, next) {
  try {

    context.req = req;
    context.session = context.session || {};

    let settings = {
      name: 'session',
      secret: 'very_secret',
      silentErrors: true,
      verifyOptions: {},
      signOptions: {},
      cookieOptions: {}
    };

    settings = deepmerge(settings, getSetting(SETTINGS_KEY, {}));

    const token = req.cookies[ settings.name ];

    if (token) {
      try {
        context.session = deepmerge(context.session, verify(token, settings.secret, settings.verifyOptions));
      } catch (e) {
        if (e.message !== "jwt expired" && !settings.silentErrors) {
          return next(e);
        }
      }
    }

    let sent = false;

    const sendCookie = function sendCookie(cb) {
      if (!sent) {
        sent = true;
        try {
          const outputToken = sign(context.session, settings.secret, settings.signOptions);
          if (context.session && Object.keys(context.session).length) {
            res.cookie(settings.name, outputToken, settings.cookieOptions);
          } else {
            res.cookie(settings.name, '', settings.cookieOptions);
          }
          // eslint-disable-next-line no-empty
        } catch (e) {
        }
      }
      return cb.apply(this, [...arguments].slice(1));
    };

    res.writeHead = sendCookie.bind(res, res.writeHead);
    res.status = sendCookie.bind(res, res.status);
    res.send = sendCookie.bind(res, res.send);
    res.end = sendCookie.bind(res, res.end);

  } catch(e) {
    return next(e);
  }
  next();
}, { order: 21, name: 'webtoken-session-middleware' });
