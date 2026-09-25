import { getMailgunClient, MAILGUN_DOMAIN } from '../mailgun/mailgunClient';
import type { RenderedEmail } from './renderEmail';

/**
 * Send an email using Mailgun. Returns true for success or false for failure.
 */
export const sendMailgunEmail = async (email: RenderedEmail): Promise<boolean> => {
  if (email.user?.deleted) {
    // eslint-disable-next-line no-console
    console.error("Attempting to send an email to a deleted user");
    return false;
  }

  const mailgunClient = getMailgunClient();
  
  if (!mailgunClient) {
    // eslint-disable-next-line no-console
    console.error("Unable to send email because no Mailgun API key is configured");
    return false;
  }
  
  const result = await mailgunClient.messages.create(MAILGUN_DOMAIN, {
    from: email.from,
    to: email.to,
    subject: email.subject,
    text: email.text,
    html: email.html
  });
  
  return result.status === 200;
}
