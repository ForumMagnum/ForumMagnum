import { DatabaseServerSetting } from '../databaseSettings';
import type { RenderedEmail } from './renderEmail';
import nodemailer from 'nodemailer';
import client from '@sendgrid/mail';
import { getUserEmail } from '../../lib/collections/users/helpers';
import { captureException } from '@sentry/core';

export const defaultEmailSetting = new DatabaseServerSetting<string>('defaultEmail', "hello@world.com")
export const mailUrlSetting = new DatabaseServerSetting<string | null>('mailUrl', null) // The SMTP URL used to send out email

/**
 * Set "sendgrid.useTemplates" to true if you want to send transactional emails via Sendgrid templates.
 * Populate "sendgrid.templateIds" like {<notificationType>: <templateId>}.
*/
export const useSendgridTemplatesSetting = new DatabaseServerSetting("sendgrid.useTemplates", false);
export const sendgridTemplateIdsSetting = new DatabaseServerSetting<Record<string, string>|null>("sendgrid.templateIds", null);
export const sendgridApiKeySetting = new DatabaseServerSetting("sendgrid.apiKey", null);

type SendgridEmailData = {
  user?: DbUser,
  to?: string,
  from?: string,
  notificationData: AnyBecauseHard,
  notifications: DbNotification[]
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

export const sendEmailSendgridTemplate = async (emailData: SendgridEmailData) => {
  const client = getSendgridEmailClient();

  const notificationType = emailData.notifications[0].type;
  const templateId = sendgridTemplateIdsSetting.get()?.[notificationType];
  if (!templateId) {
    throw new Error(`Missing sendgrid template id for notification type ${notificationType}`)
  }
  
  const fromAddress = emailData.from || defaultEmailSetting.get()
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
    mailSettings: {
      sandboxMode: {
        enable: true, // TODO: Do we want to keep this for dev? It validates the request but doesn't actually send an email so you can't verify that it looks right.
      }
    },
  }
  client
    .send(message)
    .catch(e => {
      // eslint-disable-next-line no-console
      console.error(e);
      captureException(e);
    });
}
