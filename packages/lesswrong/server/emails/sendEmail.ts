import type { RenderedEmail } from './renderEmail';
import nodemailer from 'nodemailer';

export const sendEmailSmtp = async (email: RenderedEmail): Promise<boolean> => {
  if (!('SMTP_USER' in process.env) || !('SMTP_PASSWORD' in process.env)) {
    // eslint-disable-next-line no-console
    console.log("Unable to send email because no mailserver is configured");
    return false;
  }
  
  const transport = nodemailer.createTransport({
    host: "smtp.mailgun.org",
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    }
  });
  
  const result = await transport.sendMail({
    from: email.from,
    to: email.to,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });

  return true;
}
