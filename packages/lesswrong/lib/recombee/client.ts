import { ApiClient, requests } from 'recombee-api-client';
import { recombeeDatabaseIdSetting, recombeePublicApiTokenSetting } from '../publicSettings';


const getRecombeeClientOrThrow = (() => {
    let client: ApiClient;
  
    return () => {
      if (!client) {
        const databaseId = recombeeDatabaseIdSetting.get();
        const apiToken = recombeePublicApiTokenSetting.get();
  
        if (!databaseId || !apiToken) {
          throw new Error('Missing either databaseId or api token when initializing Recombee client!');
        }
        
        // TODO - pull out client options like region to db settings?
        client = new ApiClient(databaseId, apiToken, { region: 'us-west' });
      }
  
      return client;
    };
  })();

  

