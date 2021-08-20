import { DatabaseServerSetting } from "./databaseSettings";

export const mailchimpAPIKeySetting = new DatabaseServerSetting<string | null>('mailchimp.apiKey', null)
