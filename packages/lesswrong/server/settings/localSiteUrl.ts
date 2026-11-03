// Site URL for local development instances. `next dev` sets process.env.PORT
// to the port it actually bound to (whether that came from the PORT envvar,
// --port, or a fallback from a port that was already in use) before it loads
// any app code. Scripts run via `yarn repl` have no port and get the default.
export const localSiteUrl = `http://localhost:${process.env.PORT ?? 3000}/`;
