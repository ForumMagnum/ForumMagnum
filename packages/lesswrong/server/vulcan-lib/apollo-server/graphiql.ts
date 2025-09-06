// LEGACY SUPPORT FOR GRAPHIQL
// Code is taken from apollo 1.4 code and
// @see https://github.com/eritikass/express-graphiql-middleware
// This is the only way to get graphiql to work

import url from 'url';

// @seehttps://github.com/apollographql/apollo-server/blob/v1.4.0/packages/apollo-server-module-graphiql/src/resolveGraphiQLString.ts

// renderGraphiQL
/*
 * Mostly taken straight from express-graphql, so see their licence
 * (https://github.com/graphql/express-graphql/blob/master/LICENSE)
 */
/*
 * Arguments:
 *
 * - endpointURL: the relative or absolute URL for the endpoint which GraphiQL will make queries to
 * - (optional) query: the GraphQL query to pre-fill in the GraphiQL UI
 * - (optional) variables: a JS object of variables to pre-fill in the GraphiQL UI
 * - (optional) operationName: the operationName to pre-fill in the GraphiQL UI
 * - (optional) result: the result of the query to pre-fill in the GraphiQL UI
 * - (optional) passHeader: a string that will be added to the header object.
 * For example "'Authorization': localStorage['Meteor.loginToken']" for meteor
 * - (optional) editorTheme: a CodeMirror theme to be applied to the GraphiQL UI
 * - (optional) websocketConnectionParams: an object to pass to the web socket server
 */
// RobertM: This is the latest version of GraphiQL I could find which
// doesn't break schema introspection because of the EmptyViewInput having only a deprecated field in it
// (though it does still log a console error), which didn't also require refactoring
// to get it working in this old hacked-together scaffold.
const GRAPHIQL_VERSION = '1.4.6';
const SUBSCRIPTIONS_TRANSPORT_VERSION = '0.9.9';

// Ensures string values are safe to be used within a <script> tag.
// TODO: I don't think that's the right escape function
function safeSerialize(data: any): string|null {
  return data ? JSON.stringify(data).replace(/\//g, '\\/') : null;
}

export function renderGraphiQL(data: any) {
  const endpointURL = data.endpointURL;
  const endpointWs = endpointURL.startsWith('ws://') || endpointURL.startsWith('wss://');
  const subscriptionsEndpoint = data.subscriptionsEndpoint;
  const usingHttp = !endpointWs;
  const usingWs = endpointWs || !!subscriptionsEndpoint;
  const endpointURLWs = usingWs && (endpointWs ? endpointURL : subscriptionsEndpoint);

  const queryString = data.query;
  const variablesString = data.variables ? JSON.stringify(data.variables, null, 2) : null;
  const resultString = null;
  const operationName = data.operationName;
  const passHeader = data.passHeader ? data.passHeader : '';
  const editorTheme = data.editorTheme;
  const usingEditorTheme = !!editorTheme;
  const websocketConnectionParams = data.websocketConnectionParams || null;
  const rewriteURL = !!data.rewriteURL;

  /* eslint-disable max-len */
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>GraphiQL</title>
  <meta name="robots" content="noindex" />
  <style>
    html, body {
      height: 100%;
      margin: 0;
      overflow: hidden;
      width: 100%;
    }
  </style>
  <link href="//unpkg.com/graphiql@${GRAPHIQL_VERSION}/graphiql.css" rel="stylesheet" />
  <script src="//unpkg.com/react@18.3.1/umd/react.production.min.js"></script>
  <script src="//unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"></script>
  <script src="//unpkg.com/graphiql@${GRAPHIQL_VERSION}/graphiql.min.js"></script>
  ${
    usingEditorTheme
      ? `<link href="//cdn.jsdelivr.net/npm/codemirror@5/theme/${editorTheme}.min.css" rel="stylesheet" />`
      : ''
  }
  ${usingHttp ? '<script src="//cdn.jsdelivr.net/fetch/2.0.1/fetch.min.js"></script>' : ''}
  ${
    usingWs
      ? `<script src="//unpkg.com/subscriptions-transport-ws@${SUBSCRIPTIONS_TRANSPORT_VERSION}/browser/client.js"></script>`
      : ''
  }
  ${
    usingWs && usingHttp
      ? '<script src="//unpkg.com/graphiql-subscriptions-fetcher@0.0.2/browser/client.js"></script>'
      : ''
  }
</head>
<body>
  <script>
    // Collect the URL parameters
    var parameters = {};
    window.location.search.substr(1).split('&').forEach(function (entry) {
      var eq = entry.indexOf('=');
      if (eq >= 0) {
        parameters[decodeURIComponent(entry.slice(0, eq))] =
          decodeURIComponent(entry.slice(eq + 1));
      }
    });
    // Produce a Location query string from a parameter object.
    function locationQuery(params, location) {
      return (location ? location: '') + '?' + Object.keys(params).map(function (key) {
        return encodeURIComponent(key) + '=' +
          encodeURIComponent(params[key]);
      }).join('&');
    }
    // Derive a fetch URL from the current URL, sans the GraphQL parameters.
    var graphqlParamNames = {
      query: true,
      variables: true,
      operationName: true
    };
    var otherParams = {};
    for (var k in parameters) {
      if (parameters.hasOwnProperty(k) && graphqlParamNames[k] !== true) {
        otherParams[k] = parameters[k];
      }
    }
    ${
      usingWs
        ? `
    var subscriptionsClient = new window.SubscriptionsTransportWs.SubscriptionClient('${endpointURLWs}', {
      reconnect: true${
        websocketConnectionParams
          ? `,
      connectionParams: ${JSON.stringify(websocketConnectionParams)}`
          : ''
      }
    });
    var graphQLWSFetcher = subscriptionsClient.request.bind(subscriptionsClient);
    `
        : ''
    }
    ${
      usingHttp
        ? `
      // We don't use safe-serialize for location, because it's not client input.
      var fetchURL = locationQuery(otherParams, '${endpointURL}');
      // Defines a GraphQL fetcher using the fetch API.
      function graphQLHttpFetcher(graphQLParams) {
          return fetch(fetchURL, {
            method: 'post',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              ${passHeader}
            },
            body: JSON.stringify(graphQLParams),
            credentials: 'same-origin',
          }).then(function (response) {
            return response.text();
          }).then(function (responseBody) {
            try {
              return JSON.parse(responseBody);
            } catch (error) {
              return responseBody;
            }
          });
      }
    `
        : ''
    }
    ${
      usingWs && usingHttp
        ? `
      var fetcher =
        window.GraphiQLSubscriptionsFetcher.graphQLFetcher(subscriptionsClient, graphQLHttpFetcher);
    `
        : `
      var fetcher = ${usingWs ? 'graphQLWSFetcher' : 'graphQLHttpFetcher'};
    `
    }
    // When the query and variables string is edited, update the URL bar so
    // that it can be easily shared.
    function onEditQuery(newQuery) {
      parameters.query = newQuery;
      ${rewriteURL ? 'updateURL();' : ''}
    }
    function onEditVariables(newVariables) {
      parameters.variables = newVariables;
      ${rewriteURL ? 'updateURL();' : ''}
    }
    function onEditOperationName(newOperationName) {
      parameters.operationName = newOperationName;
      ${rewriteURL ? 'updateURL();' : ''}
    }
    function updateURL() {
      var cleanParams = Object.keys(parameters).filter(function(v) {
        return parameters[v];
      }).reduce(function(old, v) {
        old[v] = parameters[v];
        return old;
      }, {});
      history.replaceState(null, null, locationQuery(cleanParams) + window.location.hash);
    }
    // Render <GraphiQL /> into the body.
    ReactDOM.render(
      React.createElement(GraphiQL, {
        fetcher: fetcher,
        onEditQuery: onEditQuery,
        onEditVariables: onEditVariables,
        onEditOperationName: onEditOperationName,
        query: ${safeSerialize(queryString)},
        response: ${safeSerialize(resultString)},
        variables: ${safeSerialize(variablesString)},
        operationName: ${safeSerialize(operationName)},
        editorTheme: ${safeSerialize(editorTheme)},
        websocketConnectionParams: ${safeSerialize(websocketConnectionParams)},
      }),
      document.body
    );
  </script>
</body>
</html>`;
}

/////////////////////////////
// resolveGraphiqlString
function createGraphiQLParams(query: URLSearchParams) {
  const queryObject = query || {};
  return {
    query: queryObject.get('query') || '',
    variables: queryObject.get('variables') || '',
    operationName: queryObject.get('operationName') || '',
  };
}

/**
 * These were inferred from field access; in practice we don't seem to use any of them except `endpointURL`.
 * I guess some of them can come from the url query parameters, but I don't think anyone uses the /graphiql
 * interface that way.
 */
interface GraphiQLOptions {
  endpointURL?: string;
  subscriptionsEndpoint?: string;
  query?: string;
  variables?: any;
  operationName?: string;
  passHeader?: string;
  editorTheme?: string;
  websocketConnectionParams?: any;
  rewriteURL?: string;
}

interface GraphiQLParams {
  query?: string;
  variables?: any;
  operationName?: string;
}

function createGraphiQLData(params: GraphiQLParams, options: GraphiQLOptions) {
  return {
    endpointURL: options.endpointURL,
    subscriptionsEndpoint: options.subscriptionsEndpoint,
    query: params.query || options.query,
    variables: (params.variables && JSON.parse(params.variables)) || options.variables,
    operationName: params.operationName || options.operationName,
    passHeader: options.passHeader,
    editorTheme: options.editorTheme,
    websocketConnectionParams: options.websocketConnectionParams,
    rewriteURL: options.rewriteURL,
  };
}

export async function resolveGraphiQLString(query: URLSearchParams, options: GraphiQLOptions) {
  const graphiqlParams = createGraphiQLParams(query);
  const graphiqlData = createGraphiQLData(graphiqlParams, options);
  return renderGraphiQL(graphiqlData);
}

//////////////////
// https://github.com/eritikass/express-graphiql-middleware

/* This middleware returns the html for the GraphiQL interactive query UI
 *
 * GraphiQLData arguments
 *
 * - endpointURL: the relative or absolute URL for the endpoint which GraphiQL will make queries to
 * - (optional) query: the GraphQL query to pre-fill in the GraphiQL UI
 * - (optional) variables: a JS object of variables to pre-fill in the GraphiQL UI
 * - (optional) operationName: the operationName to pre-fill in the GraphiQL UI
 * - (optional) result: the result of the query to pre-fill in the GraphiQL UI
 */

export const graphiqlMiddleware = (options: any) => {
  return (req: any, res: any, next: any) => {
    const query = req.url && url.parse(req.url, true).query;
    resolveGraphiQLString(query, options).then(
      graphiqlString => {
        res.setHeader('Content-Type', 'text/html');
        res.write(graphiqlString);
        res.end();
      },
      error => next(error)
    );
  };
};
