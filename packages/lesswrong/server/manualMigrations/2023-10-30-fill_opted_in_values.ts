import { registerMigration } from './migrationUtils';
import Users from '../../lib/collections/users/collection';

const targetUserIds = ["grecHJcgkb3KW5wnM", "gXeEWGjTWyqgrQTzR", "75YZ666ipe3weoJaS", "c96TaP5ZJFYPabnpH", "6jLdWqegNefgaabhr", "55XxDBpfKkkBPm9H8", 
  "dLWYtvxvBnw3NZH8t", "p5TQv5CM2koCkbF2m", "5iPRfSnjako6iM6LG", "7w7hLkTTQLuPSAWTT", "EQNTWXLKMeWMp2FQS", "NHMSJPMdExqDxPsY3", "Ei73H4RbCT5TTaXNa", 
  "3yRBq9nqACXy2QmLF", "6c2KCEXTGogBZ9KoE", "9zJ7ffPXRTMyAqfPh", "YpSTBJ9dTvxv925yR", "ZXHoXihS4pwoTQq4X", "sjh6ETexxGbauitEN", "x5dv7pBwL6FhGkmWd", 
  "c8gC5wARE3fPwu94u", "my98h9K2ygm9SeEEK", "TtKkJnoHRxZyiNifZ", "YsEcyBcSk9FbPzEFc", "Cqk9Wwmj27cEJZJPj", "KmQEfgxQrdnpXYYYq", "k79hzhnYroxnMrTrL", 
  "Jd79eGWrvEu7oieao", "mfgrYb4LMk7NWXsSB", "KYWq8bkLCzMif8tyd", "qxJ28GN72aiJu96iF", "oB8LJocwmxf7nrbsb", "XMrJoM6q5Qc6hDwDX", "3WYuFjAbX2y8RoGpd", 
  "JW9FBrbKmSiBawuL9", "n4M37rPXGyL6p8ivK", "kH9qrrMWxuFLerdTu", "5snwaf7CSi8LSs9Wp", "5JqkvjdNcxwN8D86a", "vRcer5FTqagjMkcDz", "YM4phSw8xYcnBpMEM", 
  "wwBfHySR77DchHsMr", "4PWjLmEhate785ouc", "e9ToWWzhwWp5GSE7P", "n7La6YhxuAXC4m2td", "Jxt69q6j2mJjaRx4p", "AThTtkDufXp3rmMDa", "KCExMGwS2ETzN3Ksr", 
  "L4j57Ah7zd637c6c8", "S3ydcLKdejjkodNut", "3LDz4TdkvHHoMwnHr", "aBHfQ4C5fSM4TPyTn", "TgsL9QfqGupNuWm4W", "fD4ATtTkdQJ4aSpGH", "QpvwBD5AtmmFDTC3T", 
  "PWGv3R24uH9pvCnZm", "ZMy99AagtNtASLiCt", "pkioeq2Eup8JEWy7p", "xgrJowF88AdckXH9C", "4SHky5j2PNcRwBiZt", "8cHXDbntAb4pzhHTc", "A8ub28L5JfnyHHY2X", 
  "qqwfzAYaLsfmkwbsK", "egzBBPjJzPWF2wYho", "qbkPP3mQ4PHMheAEj", "n3H94S5EMDa87qyeJ", "FuSDsH7EzbJ8nuFpA", "xuGYrYJrLK4GGLS2o", "JnNixf4smAHwLeqE3", 
  "FoKb35gJijkSFYeXa", "6NBDkGWcCxvLgYHJE", "bumwHGrDqhTTPqWs2", "MEdu2HymARtsZTNtc", "FMeW5XPDTTC7d85CD", "J9dgp5xebwufp4Ej9", "HZreNNwnmQjvQEb3p", 
  "kwJBuw4FMC2h7cQYL", "RoHHX3SmMqkJ9RMEF", "ougxZzCq4AmCuxpbB", "TCjNiBLBPyhZq5BuM", "S3qc3XQcEpYRoLMW3", "66bGJdyZtpcE6282w", "pwctPH2tfgNu7BkA7", 
  "TtEoCrFeowCGb6rFK", "N9zj5qpTfqmbn9dro", "88BHmY89XnzyJnCGH", "ggH3t4opowcyEjpSq", "YaNNYeR5HjKLDBefQ", "t7fcYsg2WsKYKT6ix", "ixTSiDwB3aWtFMAEF", 
  "FHCtdJCndnd67p8vQ", "haTrhurXNmNN8EiXc", "tvNQnybMjSfiGbuM4", "eQLqnBs9c6c6HfXcx", "vWQfyFPKdACzXEZ6R", "nDpieb7g8huozpx9j", "d7EFB6KTgWwqCAyEg", 
  "kigahqp9aAKrkKP5R", "oL8S2YjrcWL4yXMqf", "uR78Q9nhNAEP5RHmC", "rv7RzMiG3esRT4CQi", "YjWHLJE4BcAKmhM7C", "fxAdQTdcYTHJj7sjJ", "f3vCc7o8abDXtR7Ym"]

registerMigration({
  name: "fillOptInValues",
  dateWritten: "2023-10-30",
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
