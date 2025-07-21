import set from "lodash/set";
import { baserates } from "./baserates";
import { localAfDevDb } from "./localAfDevDb";
import { localAfProdDb } from "./localAfProdDb";
import { localLwDevDb } from "./localLwDevDb";
import { localLwProdDb } from "./localLwProdDb";
import { prodAf } from "./prodAf";
import { prodLw } from "./prodLw";
import { z } from "zod";

const validEnvNames = z.enum(["baserates", "localAfDevDb", "localAfProdDb", "localLwDevDb", "localLwProdDb", "prodAf", "prodLw"]);

function getPublicSettings() {
  const envName = process.env.ENV_NAME;
  if (!envName) {
    console.error("ENV_NAME is not set");
    return localLwDevDb;
  }

  const parsedEnvName = validEnvNames.safeParse(envName);
  if (!parsedEnvName.success) {
    console.error(`Invalid ENV_NAME: ${envName}`);
    return localLwDevDb;
  }

  const validEnvName = parsedEnvName.data;

  switch (validEnvName) {
    case "baserates":
      return baserates;
    case "localAfDevDb":
      return localAfDevDb;
    case "localAfProdDb":
      return localAfProdDb;
    case "localLwDevDb":
      return localLwDevDb;
    case "localLwProdDb":
      return localLwProdDb;
    case "prodAf":
      return prodAf;
    case "prodLw":
      return prodLw;
  }
}

export function getPrivateSettings() {
  const rawPrivateSettings = Object.entries(process.env).filter((setting): setting is [string, string] => {
    const [key, value] = setting;
    return key.startsWith("private_") && value !== undefined;
  });

  const privateSettings: Record<string, string> = {};

  rawPrivateSettings.reduce((acc, [key, value]) => {
    const [prefix, ...settingNameParts] = key.split("_");
    if (prefix !== 'private') {

      return acc;
    }
    set(acc, settingNameParts, value);
    return acc;
  }, privateSettings);

  return privateSettings;
}

export function getSettings() {
  return {
    public: getPublicSettings(),
    private: getPrivateSettings(),
  };
}
