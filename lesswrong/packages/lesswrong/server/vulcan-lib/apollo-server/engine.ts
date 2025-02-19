import { DatabaseServerSetting } from '../../databaseSettings';
// see https://github.com/apollographql/apollo-cache-control
const apolloEngineSettings = new DatabaseServerSetting<string | null>('apolloEngine.apiKey', null)
export const engineApiKey = process.env.ENGINE_API_KEY || apolloEngineSettings.get()
// options now available:
// @see https://www.apollographql.com/docs/apollo-server/api/apollo-server.html#EngineReportingOptions
export const engineConfig = engineApiKey
  ? {
      apiKey: engineApiKey,
    }
  : undefined;
