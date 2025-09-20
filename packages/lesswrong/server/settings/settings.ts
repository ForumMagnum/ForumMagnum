import set from "lodash/set";
import { baserates } from "./baserates";
import { localAfDevDb } from "./localAfDevDb";
import { localAfProdDb } from "./localAfProdDb";
import { localLwDevDb } from "./localLwDevDb";
import { localLwProdDb } from "./localLwProdDb";
import { prodAf } from "./prodAf";
import { prodLw } from "./prodLw";
import { testSettings } from "./test";
import { testCrosspostSettings } from "./testCrosspost";
import { z } from "zod";
import { isAnyTest } from "@/lib/executionEnvironment";
import { isAF } from "@/lib/forumTypeUtils";

const validEnvNames = z.enum(["test", "testCrosspost", "baserates","localLwDevDb", "localLwProdDb", "prodLw"]);

function getPublicSettings() {
  if (isAnyTest) {
    return testSettings;
  }
  const envName = process.env.ENV_NAME;
  if (!envName) {
    // eslint-disable-next-line no-console
    console.error("ENV_NAME is not set");
    return localLwDevDb;
  }

  const parsedEnvName = validEnvNames.safeParse(envName);
  if (!parsedEnvName.success) {
    // eslint-disable-next-line no-console
    console.error(`Invalid ENV_NAME: ${envName}`);
    return localLwDevDb;
  }

  const validEnvName = parsedEnvName.data;

  switch (validEnvName) {
    case "test":
      return testSettings;
    case "testCrosspost":
      return testCrosspostSettings;
    case "baserates":
      return baserates;
    case "localLwDevDb":
      return isAF() ? localAfDevDb : localLwDevDb;
    case "localLwProdDb":
      return isAF() ? localAfProdDb : localLwProdDb;
    case "prodLw":
      return isAF() ? prodAf : prodLw;
  }
}

let privateSettings: Record<string, string>|null = null;
export function getPrivateSettings() {
  if (!privateSettings) {
    const rawPrivateSettings = Object.entries(process.env).filter((setting): setting is [string, string] => {
      const [key, value] = setting;
      return key.startsWith("private_") && value !== undefined;
    });
  
    const newPrivateSettings: Record<string, string> = {};
  
    rawPrivateSettings.reduce((acc, [key, value]) => {
      const [prefix, ...settingNameParts] = key.split("_");
      if (prefix !== 'private') {
  
        return acc;
      }
      set(acc, settingNameParts, value);
      return acc;
    }, newPrivateSettings);
    privateSettings = newPrivateSettings;
  }

  return privateSettings;
}

export function getSettings() {
  return {
    public: getPublicSettings(),
    private: getPrivateSettings(),
  };
}
