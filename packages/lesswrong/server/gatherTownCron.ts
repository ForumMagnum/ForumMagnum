import { addCronJob } from './cronUtil';
import { createMutator, Globals } from './vulcan-lib';
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
    interval: "every 3 minutes",
    job() {
      void pollGatherTownUsers();
    }
  });
}

const pollGatherTownUsers = async () => {
  const roomName = gatherTownRoomName.get();
  const roomId = gatherTownRoomId.get();
  if (!roomName || !roomId) return;
  const gatherTownUsers = await getGatherTownUsers(gatherTownRoomPassword.get(), roomId, roomName);
  // eslint-disable-next-line no-console
  console.log(gatherTownUsers);
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
Globals.pollGatherTownUsers = pollGatherTownUsers;

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
  const socket = new WebSocket(`wss://${gatherTownWebsocketServer.get()}`);
  socket.on('open', function (data) {
    sendMessageOnSocket(socket, {
      event: "init",
      token: token,
      version: 3,
    });
  });

  let playerNamesById: Record<string,string> = {}
  let playerInfoByName: Record<string,GatherTownPlayerInfo> = {};

  socket.on('message', function (data: any) {
    const firstByte: any = data.readUInt8(0);
    if (firstByte === 0) {
      // A JSON message
      const jsonResponse = messageToJson(data);
      if (jsonResponse) {
        if (jsonResponse.event === "ready") {
          sendMessageOnSocket(socket, {
            event: "rpc",
            target: "space",
            args: {
              type: "subscribe",
              space: `${roomId}\\${roomName}`
            }
          });
        }
      }
    } else if (firstByte === 1) {
      // A binary message
      const parsedMessage = interpretBinaryMessage(data)
      if (parsedMessage?.players) {
        for (let player of parsedMessage.players) {
          playerNamesById[player.id] = player.name;
          playerInfoByName[player.name] = player;
        }
      }
    } else {
      // Unrecognized message type
    }
  });

  // We wait 3s for any responses to arrive via the socket message
  await wait(3000);

  socket.close();
  const playerNames = _.values(playerNamesById);
  return toDictionary(playerNames, name=>name, name=>playerInfoByName[name]);
}

function stringToArrayBuffer(string) {
  var binary_string = Buffer.from(string).toString(`binary`);
  var len = binary_string.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i <= len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

const sendMessageOnSocket = (socket: any, message: any) => {
  const json = JSON.stringify(message);
  const arrayBuffer = stringToArrayBuffer(json);
  socket.send(arrayBuffer);
}

const messageToJson = (data: any) => {
  const messageBody = data.toString('utf8').substring(1);
  if (isJson(messageBody))
    return JSON.parse(messageBody);
  else
    return null;
}

function isJson(str: string): boolean {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

const playerMessageHeaderLen = 29;
const mapNameOffset = 17
const playerNameOffset = 19
const playerStatusOffset = 23
const playerIconOffset = 25
const playerIdOffset = 27;

// Decoded using echo AS...<rest of base64 message> | base64 -d | hexdump -C

function interpretBinaryMessage(data: any): {players: {map: string, name: string, id: string, status: string}[]} | null { 
  const buf = Buffer.from(data);
  // First byte is 1 to indicate it's a binary message
  if (buf.readUInt8(0) !== 1) {
    //eslint-disable-next-line no-console
    console.log("Not a recognizable binary message");
    return null;
  }
  // Second byte is the length of string roomId\roomName
  const targetSpaceLen = buf.readUInt8(1);
  
  // This is followed by a series of messages where the first byte is a message
  // type. The message lengths/alignment are unfortunately not marked. We only
  // understand message type 0 (player metadata).
  let pos = 2+targetSpaceLen;
  const players: Array<any> = [];
  while (pos < buf.length) {
    const messageType = buf.readUInt8(pos);
    if (messageType === 0) {
      const mapNameLen = buf.readUInt8(pos+mapNameOffset);
      const playerNameLen = buf.readUInt8(pos+playerNameOffset);
      const playerStatusLen = buf.readUInt8(pos+playerStatusOffset)
      const playerIconLen = buf.readUInt8(pos+playerIconOffset);
      const playerIdLen = buf.readUInt8(pos+playerIdOffset);
      
      const mapNameStart = pos+playerMessageHeaderLen;
      const playerNameStart = mapNameStart+mapNameLen;
      const playerStatusStart = playerNameStart+playerNameLen;
      const playerIconStart = playerStatusStart+playerIconLen;
      const playerIdStart = playerIconStart+playerStatusLen;
      
      const mapName = buf.slice(mapNameStart, mapNameStart+mapNameLen).toString("utf8");
      const playerName = buf.slice(playerNameStart, playerNameStart+playerNameLen).toString("utf8");
      const playerstatus = buf.slice(playerStatusStart, playerStatusStart+playerStatusLen).toString("utf8");
      const playerId = buf.slice(playerIdStart, playerIdStart+playerIdLen).toString("utf8");
      
      players.push({
        map: mapName,
        name: playerName,
        id: playerId,
        status: playerstatus
      });
      
      pos = playerIdStart+playerIdLen;
    } else {
      // Unrecognized message type. Return what we have so far.
      return {players};
    }
  }
  
  return {players};
}

// Wait utility function
const wait = (ms: number) => new Promise((r, j) => setTimeout(r, ms))
