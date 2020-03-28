import { addGraphQLSchema, addGraphQLResolvers, addGraphQLQuery } from '../../lib/vulcan-lib/graphql';
import { DatabaseMetadata } from '../../lib/collections/databaseMetadata/collection';
import { getSetting } from '../../lib/vulcan-lib';
import fetch from 'node-fetch'

const CoronavirusDataRow = `type MozillaHubsData {
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

addGraphQLSchema(CoronavirusDataRow);

async function getDataFromMozillaHubs() {
  const { value: mozillaHubsAPIKey } = await DatabaseMetadata.findOne({name: "mozillaHubsAPIKey"})
  const { value: mozillaHubsUserId } = await DatabaseMetadata.findOne({name: "mozillaHubsUserId"})
  var requestOptions = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${mozillaHubsAPIKey}`
    },
    redirect: 'follow'
  };
  const response = await fetch(`https://hubs.mozilla.com/api/v1/media/search?source=favorites&type=rooms&user=${mozillaHubsUserId}`, requestOptions)
  return await response.text()
}

const coronaVirusResolvers = {
  Query: {
    async MozillaHubsRoomData(root, { roomId }, context) {
      const rawRoomData:any = await getDataFromMozillaHubs()
      const processedData = JSON.parse(rawRoomData)
      const correctRoom = processedData.entries.find(entry => entry.id === roomId)
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

addGraphQLResolvers(coronaVirusResolvers);

addGraphQLQuery('MozillaHubsRoomData(roomId: String): MozillaHubsData');
