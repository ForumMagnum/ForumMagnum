# webtoken-session

> A server-side session API for Vulcan.js.

This meteor package provides a session object on the Vulcan.js render context. 

The session is stored inside a [jsonwebtoken](https://jwt.io/) cookie on the client and is automatically saved at the end of each request. (including GraphQL queries)

Particularly useful when used in conjunction with [internal-graphql](https://gist.github.com/voodooattack/c4f7a261ea189ffb1894e9cb5e018587)*, which makes GraphQL requests internal to the server process. 

## Settings:

To configure the package, store your configuration under the `webtoken-session` field in `settings.json`.

```js
{
  "webtoken-session": {
    "name": "session", // The name of the cookie issued to the browser.
    "secret": "very_secret", // The secret used to sign the jsonwebtoken.
    "silentErrors": true, // Never throw verification errors, token expiry errors are never thrown in both cases.  
    "verifyOptions": {}, // Webtoken verification options. See: https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback 
    "signOptions": {}, // Webtoken signing options. See: https://github.com/auth0/node-jsonwebtoken#jwtsignpayload-secretorprivatekey-options-callback
    "cookieOptions": {} // res.cookie() options. See: http://expressjs.com/en/api.html#res.cookie
  }
}
```

#### * - Note:

Access to the render context inside resolvers may require a small edit to Vulcan.js. 

This is using version 1.7.0.

Simply add this line:
```js
  options.context.getRenderContext = () => req.renderContext;
```
Inside the file `packages/vulcan-lib/lib/server/apollo_server.js`, so that it looks like this:

```js
    // merge with custom context
    options.context = deepmerge(options.context, GraphQLSchema.context);
    
    //////////////////////////////////////////////////////////////
    options.context.getRenderContext = () => req.renderContext; // !! Provide access to the render context. !!
    //////////////////////////////////////////////////////////////
    
    // go over context and add Dataloader to each collection
    Collections.forEach(collection => { ...
```

Then you can use it like this:

Inside middleware:
```js
withRenderContextEnvironment(async function (renderContext, req, res, next) {
  if (!renderContext.session.locale) {
    // A locale has not been negotiated yet, negotiate one.
    try {
      renderContext.session.locale = req.acceptsLanguages(...localeManager.availableLocales);
    } catch (e) {
      return next(e);
    }
  }
  next();
}, { order: 22, name: 'intl-negotiation-middleware' });
```
And here's a usage example inside resolvers:
```js
GraphQLSchema.addResolvers({
  Query: {
    /**
    * Format a message based on the supplied locale.
    * If no locale is explicitly supplied, the current locale will be used.
    */
    formatMessage(root, { locale, message, variables }, context) {
      const rc = context.getRenderContext();
      locale = locale || rc.session.locale;
      return context.localeManager.format(locale, message, variables);
    }
  },
  Mutation: {
    /**
    * This mutation switches the active site locale. It will persist the new locale in the session object.
    * A new cookie will be returned to the client with the GraphQL server's response, and all subsequent 
    * requests will have their `session.locale` adjusted.
    */
    switchLocale(root, { localeCode }, context) {
      const rc = context.getRenderContext();
      rc.session.locale = localeCode;
      return context.locale = localeCode;
    }
  }
});
```
