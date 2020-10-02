import { addCronJob } from './cronUtil';
import { newMutation } from './vulcan-lib';
import { LWEvents } from '../lib/collections/lwevents/collection';

const gatherTownRoomId = new DatabaseServerSetting<string | null>("gatherTownRoomId", "aPVfK3G76UukgiHx")
const gatherTownRoomName = new DatabaseServerSetting<string | null>("gatherTownRoomName", "lesswrong-campus")
const gatherTownRoomPassword = new DatabaseServerSetting<string | null>("gatherTownRoomPassword", "the12thvirtue")

if (Meteor.isProduction) {
  addCronJob({
    name: 'gatherTownGetUsers',
    schedule(parser) {
      return parser.text(`every 3 minutes`);
    },
    async job() {
      const gatherTownUsers = await getGatherTownUsers(gatherTownRoomPassword.get(), gatherTownRoomId.get(), gatherTownRoomName.get());
      void newMutation({
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


import fetch from 'node-fetch';
import WebSocket from 'ws';
import { DatabaseServerSetting } from './databaseSettings';

const getGatherTownUsers = async (password, roomId, roomName) => {
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
  const socket = new WebSocket(`wss://premium-002.gather.town/?token=${token}`);
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

  let players = {}

  socket.on('message', function (data) {
    const parsedData = data.toString('utf8').substring(1)
    if (isJson(parsedData)) {
      try {
        // Have to cut the first character before parsing as JSON because that \u0 (same as above)
        const jsonResponse = JSON.parse(data.toString('utf8').substring(1));
        if (jsonResponse.message && jsonResponse.message.type === "player") {
          players[jsonResponse.message.info.name] = jsonResponse.message.info
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

  return players
}

function isJson(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

// Wait utility function
const wait = ms => new Promise((r, j) => setTimeout(r, ms))
