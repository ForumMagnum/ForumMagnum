// githunt/meteor r-a example
import React from 'react';
import ReactDOM from 'react-dom/server'
import { ApolloProvider, renderToStringWithData } from 'react-apollo';
import { WebApp } from 'meteor/webapp';
import { match, RouterContext } from 'react-router';
import Cheerio from "cheerio/lib/cheerio";
import ApolloClient from 'apollo-client';
import "isomorphic-fetch";

// nova
import { meteorClientConfig } from 'meteor/nova:apollo';
import { configureStore } from "./store.js";
import { Components, Routes } from 'meteor/nova:core';

// rr:ssr
import cookieParser from 'cookie-parser';


function isAppUrl({ url }) {
  if (url === "/favicon.ico" || url === "/robots.txt") return false;
  if (url === "/app.manifest") return false;
  return true;
}

// Thank you FlowRouter for this wonderful idea :)
// https://github.com/kadirahq/flow-router/blob/ssr/server/route.js
function moveScripts(data) {
  const $ = Cheerio.load(data, { decodeEntities: false });
  const heads = $("head script").not("[data-ssr-ignore=\"true\"]");
  const bodies = $("body script").not("[data-ssr-ignore=\"true\"]");
  $("body").append([...heads, ...bodies]);

  // Remove empty lines caused by removing scripts
  $("head").html($("head").html().replace(/(^[ \t]*\n)/gm, ""));
  $("body").html($("body").html().replace(/(^[ \t]*\n)/gm, ""));
  return $.html();
}

function moveStyles(data) {
  const $ = Cheerio.load(data, { decodeEntities: false });
  const styles = $("head link[type=\"text/css\"]").not("[data-ssr-ignore=\"true\"]");
  $("head").append(styles);

  // Remove empty lines caused by removing scripts
  $("head").html($("head").html().replace(/(^[ \t]*\n)/gm, ""));
  return $.html();
}


function patchResWrite(originalWrite, { markup, initialState }) {
  return function patch(data) {
    if (typeof data === "string" && data.indexOf("<!DOCTYPE html>") === 0) {
      data = data.replace("<body>", `
        <script>
          window.__APOLLO_STATE__ = ${JSON.stringify(initialState)};
        </script>
        <body>
      `)
      data = moveStyles(data);
      data = moveScripts(data);
      data = data.replace("<body>", `<body><div id="root">${markup}</div>`);
    }
    originalWrite.call(this, data);
  };
}

Meteor.startup(function initServerRouting() {
  const indexRoute = _.filter(Routes, route => route.path === '/')[0];
  const childRoutes = _.reject(Routes, route => route.path === '/');
  
  delete indexRoute.path; // delete the '/' path to avoid warning
  
  const routes = {
    path: '/',
    component: Components.App,
    indexRoute,
    childRoutes,
  };
  
  // /!\ IIFE
  Meteor.bindEnvironment(function firstLevelServerRouting() {
    WebApp.rawConnectHandlers.use(cookieParser());
    
    WebApp.connectHandlers.use(Meteor.bindEnvironment(function grabCookiesLevel(req, res, next) {
      if (!isAppUrl(req)) {
        next();
        return;
      }
      
      console.log('cookies', req.cookies); // eslint-disable-line no-console
      const loginToken = req.cookies['meteor_login_token'];
      
      match({ routes, location: req.originalUrl }, Meteor.bindEnvironment((error, redirectLocation, renderProps) => {
        if (redirectLocation) {
          res.redirect(redirectLocation.pathname + redirectLocation.search);
        } else if (error) {
          console.error('ROUTER ERROR:', error); // eslint-disable-line no-console
          res.status(500);
        } else if (renderProps) {
          const client = new ApolloClient(meteorClientConfig({cookieLoginToken: loginToken}));
          const store = configureStore(client);
          
          const component = (
            <ApolloProvider client={client} store={store}>
              <RouterContext {...renderProps} />
            </ApolloProvider>
          );
          
          renderToStringWithData(component).then(markup => {
            const data = client.store.getState().apollo.data;
            res.status(200);
            res.write = patchResWrite(res.write, {markup, initialState: {apollo: data}});
            next();
          }).catch(e => console.error('RENDERING ERROR:', e)); // eslint-disable-line no-console
        } else {
          res.writeHead(404);
          res.write('Not found');
          res.end();
        }
      }));
    }));
  })();
});
