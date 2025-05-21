import { DatabaseServerSetting } from "./databaseSettings";

export const mailchimpAPIKeySetting = new DatabaseServerSetting<string | null>('mailchimp.apiKey', null)
export const lightconeFundraiserStripeSecretKeySetting = new DatabaseServerSetting<string | null>('stripe.lightconeFundraiserSecretKey', null)
