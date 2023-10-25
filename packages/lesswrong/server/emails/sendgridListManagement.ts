import client from '@sendgrid/client';
import { getUserEmail } from '../../lib/collections/users/helpers';
import { captureException } from '@sentry/core';
import { sendgridApiKeySetting } from './sendEmail';


let sendgridClient: typeof client|null = null
const getSendgridClient = () => {
  if (sendgridClient) return sendgridClient;
  const apiKey = sendgridApiKeySetting.get();
  if (!apiKey) {
    throw new Error("Attempting to use sendgrid without an API key");
  }
  client.setApiKey(apiKey);
  sendgridClient = client;
  return client;
}

/**
 * Adds the given user to the given Sendgrid list.
 */
export const addToSendgridList = (user: DbUser, listId: string) => {
  const client = getSendgridClient();
  
  const email = getUserEmail(user)
  if (!email) {
    throw new Error("Failed to add user to sendgrid list because they had no email address");
  }
  
  const data = {
    list_ids: [listId],
    contacts: [
      {
        email,
      }
    ]
  };

  client
    .request({
      method: 'PUT',
      url: '/v3/marketing/contacts',
      body: data
    })
    .catch(e => {
      // eslint-disable-next-line no-console
      console.error(e);
      captureException(e);
    });
}

/**
 * Removes the given user from the given Sendgrid list.
 */
export const removeFromSendgridList = async (user: DbUser, listId: string) => {
  const client = getSendgridClient();
  
  const email = getUserEmail(user)
  if (!email) {
    throw new Error("Failed to remove user from sendgrid list because they had no email address");
  }
  
  try {
    // Get the user's Sendgrid contactId
    const [response, body] = await client.request({
        method: 'POST',
        url: `/v3/marketing/contacts/search/emails`,
        body: {emails: [email]}
      })
    
    // If we don't find them, assume they're already not in the list
    const contactId = body?.result?.[email]?.contact?.id
    if (!contactId) return

    await client.request({
        method: 'DELETE',
        url: `/v3/marketing/lists/${listId}/contacts`,
        qs: {contact_ids: contactId}
      })

  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    captureException(e);
  }
}
