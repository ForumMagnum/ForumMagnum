import { ApiClient, SetViewPortion } from 'recombee-js-api-client';
import { recombeeDatabaseIdSetting, recombeePublicApiTokenSetting } from '../publicSettings';

export interface RecombeeViewPortionProps {
    timestamp: Date;
    userId: string;
    postId: string;
    portion: number;
    recommId?: string;
}

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


const recombeeRequestHelpers = {
  createViewPortionRequest(viewPortionProps: RecombeeViewPortionProps) {
    const { userId, postId, portion, timestamp, recommId } = viewPortionProps;
    return new SetViewPortion(userId, postId, portion, {
      timestamp: timestamp.toUTCString(), 
      cascadeCreate: false,
      recommId: recommId
    });
  }
}


const recombeeApi = {
    async createViewPortion(viewPortionProps: RecombeeViewPortionProps) {
      const client = getRecombeeClientOrThrow();
      const request = recombeeRequestHelpers.createViewPortionRequest(viewPortionProps);
      console.log("Sending viewPortion request")
      return client.send(request);
    }

}

export { recombeeRequestHelpers, recombeeApi }
