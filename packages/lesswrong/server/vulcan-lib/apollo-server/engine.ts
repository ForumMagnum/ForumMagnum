import { getSetting } from '../../../lib/vulcan-lib/settings';
// see https://github.com/apollographql/apollo-cache-control
export const engineApiKey = process.env.ENGINE_API_KEY || getSetting('apolloEngine.apiKey');
// options now available:
// @see https://www.apollographql.com/docs/apollo-server/api/apollo-server.html#EngineReportingOptions
export const engineConfig = engineApiKey
  ? {
      apiKey: engineApiKey,
    }
  : undefined;
