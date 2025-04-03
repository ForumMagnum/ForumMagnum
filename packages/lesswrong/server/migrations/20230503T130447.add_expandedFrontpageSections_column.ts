import Users from "../../server/collections/users/collection";
import { addField, dropField } from "./meta/utils";

export const acceptsSchemaHash = "be2a53332cb5a42e9fafd13c2e7fde88";

const grandfatheredUsers = [
  "qPKDyyDp6Sue7hTCX",
  "QNsCYAaKRdXZWKPmE",
  "by9NY52NogjqsWPTa",
  "z8AgEzkd75tZXmenn",
  "CsBhSvtaQJahgkyRk",
  "wJJ49R7a6KtC6p5cv",
  "nsWWNEFS6ZRqwX4gg",
  "XEXfmuFShAq36Waod",
  "SQ7H7jepRi3qgAifP",
  "LFEy38N85zYZg43Yp",
  "KAWvDvYXxJKa9reTF",
  "RsRXi2YoKHQ5532kE",
  "4jRPNwELjeYLMCGdv",
  "AGWTBgADiMqsJYLBG",
  "x4W8LiCsoM3KqEXYD",
  "q3yFqd2fHsLPoBmpQ",
  "LtdJMBT8tZGz8ZzAT",
  "crTdfaLW9Q6icBv6u",
  "EsaHDqgx4B8xXFH8h",
  "crLqhHBEoYfhfCSfr",
  "eXcBacSB753oemgnC",
  "jvMsm6AjHKqdwqB3q",
  "WuhwawdTjTDptBFYD",
  "eT2eNpBSsssxNeRPp",
  "X9iSJZnf59HeGtFnH",
  "cc65xa5snDnJoY3WT",
  "oZa9wz3nG2wgW98az",
  "6fGCXFx6zzQaXfcZv",
  "qGBzcc2tcFN336Jmi",
  "i5aiz4ZwvCxfnFgbq",
  "mkYJcyuSrMxAeDKFD",
  "Ftq6PfR4iChcbNkw2",
  "XponqBQAQRk5DrAYY",
  "dHQjCaGauuyg6rFJr",
  "9YxYPxzvtc38xNCuk",
];

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "expandedFrontpageSections");
  await db.none(`
    UPDATE "Users"
    SET "expandedFrontpageSections" = '{"community":false}'::JSONB
    WHERE "_id" IN ($1:csv)
  `, [grandfatheredUsers]);
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "expandedFrontpageSections");
}
