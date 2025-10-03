import { apolloEngineSettings } from '../../databaseSettings';
// see https://github.com/apollographql/apollo-cache-control
export const engineApiKey = process.env.ENGINE_API_KEY || apolloEngineSettings.get()
// options now available:
// @see https://www.apollographql.com/docs/apollo-server/api/apollo-server.html#EngineReportingOptions
export const engineConfig = engineApiKey
  ? {
      apiKey: engineApiKey,
    }
  : undefined;
