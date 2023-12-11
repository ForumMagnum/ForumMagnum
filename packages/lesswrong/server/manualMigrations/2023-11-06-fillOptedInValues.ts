import { registerMigration } from './migrationUtils';
import Users from '../../lib/collections/users/collection';


// this list was produced using the query and then spreadsheet logic
// located in https://docs.google.com/spreadsheets/d/1bkC3MpPE9WcC54JFNcw1jiA4m5v_Dwysk_1sPL0m9RA/edit#gid=1727558334
const targetUserIds = [
  "2HL96yNHSLfzYbncR", "2YDxEr2R8qbqp4BwC", "2ZFPtLBvpev34upT9", "3LDz4TdkvHHoMwnHr", "3yRBq9nqACXy2QmLF", "4PWjLmEhate785ouc", 
  "4SHky5j2PNcRwBiZt", "55XxDBpfKkkBPm9H8", "5iPRfSnjako6iM6LG", "5JqkvjdNcxwN8D86a", "5snwaf7CSi8LSs9Wp", "66bGJdyZtpcE6282w", 
  "688wFm5TmbBZthSHK", "6c2KCEXTGogBZ9KoE", "6jLdWqegNefgaabhr", "6NBDkGWcCxvLgYHJE", "6nX9qQJzKmkxi5eQF", "6owLP3qSLEHrah2rA", 
  "75YZ666ipe3weoJaS", "7w7hLkTTQLuPSAWTT", "88BHmY89XnzyJnCGH", "8cHXDbntAb4pzhHTc", "9RSDmtYMc5kwaMm2K", "9zJ7ffPXRTMyAqfPh", 
  "A8ub28L5JfnyHHY2X", "aBHfQ4C5fSM4TPyTn", "afmmaCNsXtoM34fo9", "arrJvror7orrjpK2E", "AThTtkDufXp3rmMDa", "azR65cK3TEFTTyrMR", 
  "BdheysxHFgukJLpNa", "bumwHGrDqhTTPqWs2", "c8gC5wARE3fPwu94u", "c96TaP5ZJFYPabnpH", "Cqk9Wwmj27cEJZJPj", "Cwroombxe5s3ihyBu", 
  "d3CyyzXsAkWnSrgS2", "d7EFB6KTgWwqCAyEg", "dA5aLBYTZp7djBGgg", "dJbkx2TjbgxqwRMqz", "dLWYtvxvBnw3NZH8t", "dRGmZYGDzf5LFNjtz", 
  "DTeLybGHwmYndytte", "duSuiS6RHcAbdppBe", "e9ToWWzhwWp5GSE7P", "egzBBPjJzPWF2wYho", "Ei2M4JddfgmXj6xdB", "Ei73H4RbCT5TTaXNa", 
  "eQLqnBs9c6c6HfXcx", "EQNTWXLKMeWMp2FQS", "eXkuCJ8JpsSWb57up", "F2wa9jFQncY4wDcn8", "f3vCc7o8abDXtR7Ym", "f7F6a7bmorzo2tGez", 
  "fD4ATtTkdQJ4aSpGH", "FHCtdJCndnd67p8vQ", "FMeW5XPDTTC7d85CD", "FoKb35gJijkSFYeXa", "FuD5iZATaRJoz4N3N", "FuSDsH7EzbJ8nuFpA", 
  "fxAdQTdcYTHJj7sjJ", "g3EBjAowLk6KwbPC3", "gATSEaPEm5fk7uoWJ", "gFrEH3XgetkdwApnz", "ggH3t4opowcyEjpSq", "GME6GxE67gE7ZDFHg", 
  "GocFnp9WseQuptADr", "grecHJcgkb3KW5wnM", "gXeEWGjTWyqgrQTzR", "H9TjbrHBb6bHhjZcF", "haTrhurXNmNN8EiXc", "HHiJSvTEQkMx8ej62", 
  "HMnfd9HdRCfuRcdBG", "htE6AvSwPz73SzLTH", "HZreNNwnmQjvQEb3p", "imabKpjsF9zGeccWo", "iRKSv7TFtsfpCDRt5", "ixTSiDwB3aWtFMAEF", 
  "J3ZWohQyv9LkzPbsM", "J9dgp5xebwufp4Ej9", "Jd79eGWrvEu7oieao", "JnNixf4smAHwLeqE3", "k79hzhnYroxnMrTrL", "KCExMGwS2ETzN3Ksr", 
  "kH9qrrMWxuFLerdTu", "kigahqp9aAKrkKP5R", "KmQEfgxQrdnpXYYYq", "kwJBuw4FMC2h7cQYL", "L4j57Ah7zd637c6c8", "MEdu2HymARtsZTNtc", 
  "MEu8MdhruX5jfGsFQ", "mfgrYb4LMk7NWXsSB", "mHfRYusxhhJhE5drc", "my98h9K2ygm9SeEEK", "n3H94S5EMDa87qyeJ", "n4M37rPXGyL6p8ivK", 
  "n7La6YhxuAXC4m2td", "N9zj5qpTfqmbn9dro", "nDpieb7g8huozpx9j", "NHMSJPMdExqDxPsY3", "NqNhp8SiTxXyQCxct", "oL8S2YjrcWL4yXMqf", 
  "ougxZzCq4AmCuxpbB", "PdKrjAbfaaBtizcdk", "PogLSygz8YgfgmtmZ", "pwctPH2tfgNu7BkA7", "PWGv3R24uH9pvCnZm", "qbkPP3mQ4PHMheAEj", 
  "qDRSv6ABoPJH9bLro", "QpvwBD5AtmmFDTC3T", "qqwfzAYaLsfmkwbsK", "QWCGgKRXsWiR2iQoa", "qxJ28GN72aiJu96iF", "RoHHX3SmMqkJ9RMEF", 
  "rv7RzMiG3esRT4CQi", "S3qc3XQcEpYRoLMW3", "S3ydcLKdejjkodNut", "s5njcYBC5a7W33oTJ", "Sfj7wYBmHeZyLbzRu", "sgkrsN9vgkFmtTyXr", 
  "sjh6ETexxGbauitEN", "SnXuru6XzF555NDzE", "sWA9eDCM9AgFaZho8", "t7fcYsg2WsKYKT6ix", "TCjNiBLBPyhZq5BuM", "TgsL9QfqGupNuWm4W", 
  "TtEoCrFeowCGb6rFK", "tvNQnybMjSfiGbuM4", "uR78Q9nhNAEP5RHmC", "vbDMpDA5A35329Ju5", "vLJ3w7uk2t7j4oMXe", "vRcer5FTqagjMkcDz", 
  "vwewrYyBCcdiZ5LuP", "vWQfyFPKdACzXEZ6R", "WW4WqBfCX2udMrSiJ", "wwBfHySR77DchHsMr", "x5dv7pBwL6FhGkmWd", "xgrJowF88AdckXH9C", 
  "XMrJoM6q5Qc6hDwDX", "y53gBxah8F4eCNxDS", "YaNNYeR5HjKLDBefQ", "Yhq6mgAgTZkJFbxPH", "YjWHLJE4BcAKmhM7C", "YLFQfGzNdGA4NFcKS", 
  "YM4phSw8xYcnBpMEM", "yPJkuECKJwfn7ibFg", "YpSTBJ9dTvxv925yR", "YsEcyBcSk9FbPzEFc", "ZMy99AagtNtASLiCt", "ZXHoXihS4pwoTQq4X", 
  "ZzC2bFGnA5hiGPPCf"
]

registerMigration({
  name: "fillOptInValues",
  dateWritten: "2023-11-06",
  idempotent: true,
  action: async () => {
    for (const userId of targetUserIds) {
      await Users.rawUpdateOne(
        { _id: userId },
        { $set: { optedInToDialogueFacilitation: true } },
      );
    }
  }
});
