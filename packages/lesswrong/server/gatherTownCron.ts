import { addCronJob } from './cronUtil';
import { createMutator } from './vulcan-lib';
import { LWEvents } from '../lib/collections/lwevents/collection';
import fetch from 'node-fetch';
import WebSocket from 'ws';
import { DatabaseServerSetting } from './databaseSettings';
import { gatherTownRoomId, gatherTownRoomName } from '../lib/publicSettings';
import { isProduction } from '../lib/executionEnvironment';
import { toDictionary } from '../lib/utils/toDictionary';
import * as _ from 'underscore';
import { forumTypeSetting } from '../lib/instanceSettings';

const gatherTownRoomPassword = new DatabaseServerSetting<string | null>("gatherTownRoomPassword", "the12thvirtue")
const gatherTownWebsocketServer = new DatabaseServerSetting<string>("gatherTownWebsocketServer", "premium-009.gather.town")

if (isProduction && forumTypeSetting.get() === "LessWrong") {
  addCronJob({
    name: 'gatherTownGetUsers',
    schedule(parser) {
      return parser.text(`every 3 minutes`);
    },
    async job() {
      const roomName = gatherTownRoomName.get();
      const roomId = gatherTownRoomId.get();
      if (!roomName || !roomId) return;
      const gatherTownUsers = await getGatherTownUsers(gatherTownRoomPassword.get(), roomId, roomName);
      void createMutator({
        collection: LWEvents,
        document: {
          name: 'gatherTownUsersCheck',
          important: false,
          properties: {
            time: new Date(),
            gatherTownUsers
          }
        },
        validate: false,
      })
    }
  });
}

type GatherTownPlayerInfo = any;

const getGatherTownUsers = async (password: string|null, roomId: string, roomName: string): Promise<Record<string,GatherTownPlayerInfo>> => {
  // Register new user to Firebase
  const authResponse = await fetch("https://www.googleapis.com/identitytoolkit/v3/relyingparty/signupNewUser?key=AIzaSyCifrUkqu11lgjkz2jtp4Fx_GJh58HDlFQ", {
    "headers": {
      "accept": "*/*",
      "accept-language": "en-US,en;q=0.9",
      "cache-control": "no-cache",
      "content-type": "application/json",
      "pragma": "no-cache",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "x-client-version": "Chrome/JsCore/7.16.0/FirebaseCore-web"
    },
    "body": "{\"returnSecureToken\":true}",
    "method": "POST"
  });

  const parsedResponse = await authResponse.json();
  const token = parsedResponse.idToken;

  // Get user information
  const userInformation = await fetch("https://www.googleapis.com/identitytoolkit/v3/relyingparty/getAccountInfo?key=AIzaSyCifrUkqu11lgjkz2jtp4Fx_GJh58HDlFQ", {
    "headers": {
      "accept": "*/*",
      "accept-language": "en-US,en;q=0.9,de-DE;q=0.8,de;q=0.7",
      "cache-control": "no-cache",
      "content-type": "application/json",
      "pragma": "no-cache",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "x-client-data": "CIa2yQEIpbbJAQjBtskBCKmdygEImbXKAQj1x8oBCOfIygEI6cjKAQj0zcoBCNvVygEI+tjKAQ==",
      "x-client-version": "Chrome/JsCore/7.16.0/FirebaseCore-web"
    },
    "body": `{
            "idToken":"${token}"
        }`,
    "method": "POST",
  });

  const parsedUserInformation = await userInformation.json()

  const localId = parsedUserInformation.users[0].localId

  // Register user to Gather Town
  await fetch(`https://gather.town/api/registerUser?roomId=${roomId}%5C${roomName}&authToken=${token}`, {
    "headers": {
      "accept": "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9,de-DE;q=0.8,de;q=0.7",
      "cache-control": "no-cache",
      "pragma": "no-cache",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin"
    },
    "body": undefined,
    "method": "GET",
  });

  // Enter password
  await fetch("https://gather.town/api/submitPassword", {
    "headers": {
      "accept": "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9,de-DE;q=0.8,de;q=0.7",
      "cache-control": "no-cache",
      "content-type": "application/json;charset=UTF-8",
      "pragma": "no-cache",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
    },
    "body": `{"roomId":"${roomId}\\\\${roomName}","password":"${password}","authUser":"${localId}"}`,
    "method": "POST"
  });

  // Create WebSocket connection.
  const socket = new WebSocket(`wss://${gatherTownWebsocketServer.get()}/?token=${token}`);
  function stringToArrayBuffer(string) {
    var binary_string = Buffer.from(string).toString(`binary`);
    var len = binary_string.length;
    var bytes = new Uint8Array(len + 1);
    // We have to do some manual operation here because the Gather Town packages all start with \u0, which doesn't parse in UTF-8 (I think)
    bytes[1] = 123
    for (var i = 1; i <= len; i++) {
      bytes[i + 1] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  }
  const arrayBuffer = stringToArrayBuffer(`{"event":"init","token":"${token}","room": "${roomId}\\\\${roomName}"}`)
  socket.on('open', function (data) {
    socket.send(arrayBuffer)
  });

  let playerNamesById: Record<string,string> = {}
  let playerInfoByName: Record<string,GatherTownPlayerInfo> = {};

  socket.on('message', function (data) {
    const parsedData = data.toString('utf8').substring(1)
    if (isJson(parsedData)) {
      try {
        // Have to cut the first character before parsing as JSON because that \u0 (same as above)
        const jsonResponse = JSON.parse(data.toString('utf8').substring(1));
        if (jsonResponse.message && jsonResponse.message.type === "player") {
          const playerId = jsonResponse.message.id;
          const playerName = (jsonResponse.message.info.name)?.replace('.', '')?.replace('$', '') // We remove '.' and '$' because MongoDB doesn't support having those character in object keys
          playerNamesById[playerId] = playerName;
          playerInfoByName[playerName] = {...jsonResponse.message.info, playerId};
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log(err)
      }
    }
  });

  // We wait 3s for any responses to arrive via the socket message
  await wait(3000);

  socket.close();

  const playerNames = _.values(playerNamesById);
  return toDictionary(playerNames, name=>name, name=>playerInfoByName[name]);
}

function isJson(str: string): boolean {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

// Wait utility function
const wait = (ms: number) => new Promise((r, j) => setTimeout(r, ms))
