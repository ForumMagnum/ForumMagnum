
// To set the timeout for a round, use:
// ```
//   export const maxDuration = [time in seconds]
// ```
// See: https://vercel.com/docs/functions/configuring-functions/duration
// If you don't specify a timeout explicitly, the default is 300 (5 minutes).

export const suggestedTimeouts = {
  normalPage: 30,
  potentiallySlowPage: 90,
  graphqlApiEndpoint: 90,
  postPage: 60,
  redirector: 5,
  simpleApiRoute: 5,
  crazyApiRoute: 300,
  llmStreaming: 300,
  cronjob: 300,
};
