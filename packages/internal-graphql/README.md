# Internal GraphQL for Vulcan.js

To make a GraphQL query on a Vulcan.js server, your server has to connect to itself via a new HTTP connection every time it receives a request.

This package makes it so that Vulcan’s GraphQL queries never leave the process. All GraphQL requests are processed with no overhead.

> See also: [webtoken-session](https://gist.github.com/voodooattack/7a02881b0c762630160424f742b6f780)