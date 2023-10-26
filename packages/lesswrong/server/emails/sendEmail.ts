import { DatabaseServerSetting } from '../databaseSettings';
import type { RenderedEmail } from './renderEmail';
import nodemailer from 'nodemailer';
import client from '@sendgrid/mail';
import { getUserEmail } from '../../lib/collections/users/helpers';
import { captureException } from '@sentry/core';

export const enableDevelopmentEmailsSetting = new DatabaseServerSetting<boolean>('enableDevelopmentEmails', false)
export const defaultEmailSetting = new DatabaseServerSetting<string>('defaultEmail', "hello@world.com")
export const mailUrlSetting = new DatabaseServerSetting<string | null>('mailUrl', null) // The SMTP URL used to send out email

/**
 * Set "sendgrid.useTemplates" to true if you want to send transactional emails via Sendgrid templates.
 * Populate "sendgrid.templateIds" like {<notificationType>: <templateId>}.
*/
export const useSendgridTemplatesSetting = new DatabaseServerSetting("sendgrid.useTemplates", false);
export const sendgridTemplateIdsSetting = new DatabaseServerSetting<Record<string, string>|null>("sendgrid.templateIds", null);
export const sendgridApiKeySetting = new DatabaseServerSetting("sendgrid.apiKey", null);
// Outside of prod, we don't send emails, except to these recipients.
export const sendgridWhitelistedEmailsSetting = new DatabaseServerSetting<string[]|null>("sendgrid.whitelistedEmails", null);

type SendgridEmailData = {
  user?: DbUser,
  to?: string,
  notificationData?: AnyBecauseHard,
  notifications?: DbNotification[],
  templateName?: string
}

let sendgridEmailClient: typeof client|null = null
const getSendgridEmailClient = () => {
  if (sendgridEmailClient) return sendgridEmailClient;
  const apiKey = sendgridApiKeySetting.get();
  if (!apiKey) {
    throw new Error("Attempting to use sendgrid without an API key");
  }
  client.setApiKey(apiKey);
  sendgridEmailClient = client;
  return client;
}

const getMailUrl = () => {
  if (mailUrlSetting.get())
    return mailUrlSetting.get();
  else if (process.env.MAIL_URL)
    return process.env.MAIL_URL;
  else
    return null;
};

/**
 * Send an email. Returns true for success or false for failure.
 *
 * API descended from meteor
 */
export const sendEmailSmtp = async (email: RenderedEmail): Promise<boolean> => {
  const mailUrl = getMailUrl();
  
  if (!mailUrl) {
    // eslint-disable-next-line no-console
    console.log("Unable to send email because no mailserver is configured");
    return false;
  }
  
  const transport = nodemailer.createTransport(mailUrl);
  
  const result = await transport.sendMail({
    from: email.from,
    to: email.to,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });
  
  return true;
}

/**
 * Checks the proper database server settings and returns true
 * if the given email address matches a whitelisted email address.
 */
const isEmailWhitelistedForSendgrid = (emailAddress: string) => {
  const whitelistedEmails = sendgridWhitelistedEmailsSetting.get()
  if (!whitelistedEmails) return false;
  
  return whitelistedEmails.some(whitelistedEmail => {
    // If the whitelisted email is exactly the same as the input email, return true
    if (whitelistedEmail === emailAddress) {
      return true;
    }
    
    // If the whitelisted email contains a wildcard, perform a wildcard match
    if (whitelistedEmail.includes('*')) {
      // Escape special characters in the whitelisted email, except for the wildcard "*"
      const escapedEmail = whitelistedEmail.replace(/([.+?^=!:${}()|\[\]\/\\])/g, "\\$1").replace(/\*/g, ".*");
      // Create a RegExp object using the escaped email
      const regex = new RegExp(`^${escapedEmail}$`, 'i');

      return regex.test(emailAddress);
    }

    return false;
  });
}

export const sendEmailSendgridTemplate = async (emailData: SendgridEmailData) => {
  const client = getSendgridEmailClient();

  const notificationType = emailData.templateName ?? emailData.notifications?.[0].type;
  const templateId = notificationType && sendgridTemplateIdsSetting.get()?.[notificationType];
  if (!templateId) {
    throw new Error(`Missing sendgrid template id for notification type ${notificationType}`)
  }
  
  // Note: Currently Waking Up is sending all emails from community@wakingup.com
  // because that's the only email that is verified on Sendgrid.
  const fromAddress = defaultEmailSetting.get()
  if (!fromAddress) {
    throw new Error("No source email address configured. Make sure \"defaultEmail\" is set in your settings.json.");
  }
  
  if (!emailData.to && !emailData.user) {
    throw new Error("No destination email address for logged-out user email");
  }
  const destinationAddress = emailData.to || getUserEmail(emailData.user ?? null)
  if (!destinationAddress) {
    throw new Error("No destination email address for user email");
  }
  
  // Sandbox mode just validates the request - it doesn't actually trigger a mail send.
  // We only trigger the mail send for whitelisted email addresses, on prod, or if the "enableDevelopmentEmails" is true.
  const mailSettings = (
    isEmailWhitelistedForSendgrid(destinationAddress) ||
    process.env.NODE_ENV === 'production' ||
    enableDevelopmentEmailsSetting.get()
  ) ? {} : {
    mailSettings: {
      sandboxMode: {
        enable: true
      }
    }
  }

  const message = {
    templateId,
    personalizations: [
      {
        to: [
          {email: destinationAddress}
        ]
      }
    ],
    from: {email: fromAddress},
    ...mailSettings
  }
  client
    .send(message)
    .catch(e => {
      // eslint-disable-next-line no-console
      console.error(e);
      captureException(e);
    });
}
