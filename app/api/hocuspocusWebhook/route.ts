import { z } from 'zod';
import { captureException } from '@/lib/sentryWrapper';
import {
  verifyHocuspocusWebhookSecret,
  handleDocumentUpdated,
  handleUserDisconnected,
  handleCommentAdded,
} from '@/server/hocuspocus/hocuspocusCallbacks';

const documentUpdatedSchema = z.object({
  event: z.literal('document.updated'),
  payload: z.object({
    documentName: z.string(),
    yjsState: z.string(), // base64-encoded Yjs binary state
  }),
});

const userDisconnectedSchema = z.object({
  event: z.literal('user.disconnected'),
  payload: z.object({
    documentName: z.string(),
    userId: z.string(),
    yjsState: z.string(), // base64-encoded Yjs binary state
  }),
});

const commentAddedSchema = z.object({
  event: z.literal('comment.added'),
  payload: z.object({
    documentName: z.string(),
    authorId: z.string(),
    content: z.string(),
    threadId: z.string(),
    commentersInThread: z.array(z.string()),
  }),
});

const hocuspocusWebhookSchema = z.discriminatedUnion('event', [
  documentUpdatedSchema,
  userDisconnectedSchema,
  commentAddedSchema,
]);

type HocuspocusWebhookEvent = z.infer<typeof hocuspocusWebhookSchema>;

export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token || !verifyHocuspocusWebhookSecret(token)) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    const parseResult = hocuspocusWebhookSchema.safeParse(body);

    if (!parseResult.success) {
      const formattedErrorString = parseResult.error.format()._errors.join('\n');
      // eslint-disable-next-line no-console
      console.error('[HocuspocusWebhook] Invalid payload:', formattedErrorString);
      captureException(new Error(`Invalid Hocuspocus webhook payload: ${formattedErrorString}`));
      return new Response('Bad request', { status: 400 });
    }

    const message: HocuspocusWebhookEvent = parseResult.data;

    switch (message.event) {
      case 'document.updated': {
        const yjsState = new Uint8Array(Buffer.from(message.payload.yjsState, 'base64'));
        await handleDocumentUpdated(message.payload.documentName, yjsState);
        break;
      }

      case 'user.disconnected': {
        const yjsState = new Uint8Array(Buffer.from(message.payload.yjsState, 'base64'));
        await handleUserDisconnected(
          message.payload.documentName,
          message.payload.userId,
          yjsState,
        );
        break;
      }

      case 'comment.added': {
        await handleCommentAdded(message.payload.documentName, {
          authorId: message.payload.authorId,
          content: message.payload.content,
          threadId: message.payload.threadId,
          commentersInThread: message.payload.commentersInThread,
        });
        break;
      }
    }

    return new Response('ok', { status: 200 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[HocuspocusWebhook] Error processing webhook:', error);
    captureException(error);
    return new Response('Internal server error', { status: 500 });
  }
}
