import { addGraphQLSchema, addGraphQLResolvers, addGraphQLQuery } from '../../lib/vulcan-lib/graphql';
import { DatabaseServerSetting } from '../databaseSettings';

const MozillaHubsData = `type MozillaHubsData {
  description: String
  id: String
  previewImage: String
  lastActivatedAt: String
  lobbyCount: Int
  memberCount: Int
  name: String
  roomSize: Int
  sceneId: String
  type: String
  url: String
}`

addGraphQLSchema(MozillaHubsData);

const mozillaHubsAPIKeySetting = new DatabaseServerSetting<string | null>('mozillaHubsAPIKey', null)
const mozillaHubsUserIdSetting = new DatabaseServerSetting<string | null>('mozillaHubsUserId', null)

async function getDataFromMozillaHubs() {
  const mozillaHubsAPIKey = mozillaHubsAPIKeySetting.get()
  const mozillaHubsUserId = mozillaHubsUserIdSetting.get()
  if (!mozillaHubsAPIKey || !mozillaHubsUserId) return null
  
  var requestOptions: any = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${mozillaHubsAPIKey}`
    },
    redirect: 'follow'
  };
  const response = await fetch(`https://hubs.mozilla.com/api/v1/media/search?source=favorites&type=rooms&user=${mozillaHubsUserId}`, requestOptions)
  return await response.text()
}

const mozillaHubsResolvers = {
  Query: {
    async MozillaHubsRoomData(root: void, { roomId }: { roomId: string }, context: ResolverContext) {
      const rawRoomData: any = await getDataFromMozillaHubs()
      if (!rawRoomData) return null
      const processedData = JSON.parse(rawRoomData)
      if (!processedData?.entries) return null;
      const correctRoom = processedData.entries.find((entry: any) => entry.id === roomId)
      if (!correctRoom) return null
      const { 
        description,
        id,
        images,
        last_activated_at,
        lobby_count,
        member_count,
        name,
        room_size,
        scene_id,
        type,
        url: roomUrl,
      } = correctRoom
      return {
        description,
        id,
        previewImage: images?.preview?.url,
        lastActivatedAt: last_activated_at,
        lobbyCount: lobby_count,
        memberCount: member_count,
        name,
        roomSize: room_size,
        sceneId: scene_id,
        type,
        url: roomUrl,
      }
    }
  },
};

addGraphQLResolvers(mozillaHubsResolvers);

addGraphQLQuery('MozillaHubsRoomData(roomId: String): MozillaHubsData');
