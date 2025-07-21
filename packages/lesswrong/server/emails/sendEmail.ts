import { mailUrlSetting } from '../databaseSettings';
import type { RenderedEmail } from './renderEmail';
import nodemailer from 'nodemailer';

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
  if (email.user?.deleted) {
    // eslint-disable-next-line no-console
    console.error("Attempting to send an email to a deleted user");
    return false;
  }

  const mailUrl = getMailUrl();
  
  if (!mailUrl) {
    // eslint-disable-next-line no-console
    console.error("Unable to send email because no mailserver is configured");
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
