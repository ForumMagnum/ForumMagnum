import { getMailgunClient, MAILGUN_DOMAIN } from '../mailgun/mailgunClient';
import type { RenderedEmail } from './renderEmail';

/**
 * Campaign metadata attached to an outgoing message. Mailgun echoes the `v:`
 * variables back verbatim on every webhook event for that message, which is what
 * makes a bare "recipient clicked this URL" event attributable to an issue.
 */
export interface EmailTracking {
  /** Groups events by kind of email, e.g. "aiDigest". Also sent as a Mailgun tag. */
  emailType: string;
  /** Identifies the specific send, e.g. an AiDigestIssues._id. */
  campaignId?: string;
  /** The recipient's Users._id. Deliberately not their email address. */
  recipientId?: string;
}

/**
 * Whether click/open events reach us at all depends on domain-level tracking
 * settings in the Mailgun dashboard, which are outside version control. If click
 * tracking is switched off for MAILGUN_DOMAIN, these variables are still attached
 * but no `clicked` events will be generated.
 */
function mailgunTrackingFields(tracking: EmailTracking) {
  return {
    "o:tag": tracking.emailType,
    "v:emailType": tracking.emailType,
    ...(tracking.campaignId ? { "v:campaignId": tracking.campaignId } : {}),
    ...(tracking.recipientId ? { "v:recipientId": tracking.recipientId } : {}),
  };
}

/**
 * Send an email using Mailgun. Returns true for success or false for failure.
 */
export const sendMailgunEmail = async (email: RenderedEmail, tracking?: EmailTracking): Promise<boolean> => {
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
    html: email.html,
    ...(tracking ? mailgunTrackingFields(tracking) : {}),
  });
  
  return result.status === 200;
}
