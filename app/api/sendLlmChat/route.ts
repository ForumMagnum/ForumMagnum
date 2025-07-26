import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { sendLlmChatHandler } from "@/server/resolvers/anthropicResolvers";
import { NextRequest } from "next/server";
import { ClaudeMessageRequestSchema } from "@/components/languageModels/schema";
import { userHasLlmChat } from "@/lib/betas";
import { htmlToMarkdown } from "@/server/editor/conversionUtils";

export async function POST(req: NextRequest) {
  try {
    // Get request body and context first
    const [body, context] = await Promise.all([
      req.json(),
      getContextFromReqAndRes({ req, isSSR: false })
    ]);

    const currentUser = context.currentUser;
    
    // Validation: Check user permissions
    if (!userHasLlmChat(currentUser)) {
      return new Response('Only admins and authorized users can use Claude chat right now', {
        status: 403
      });
    }

    // Validation: Parse request body
    const parsedBody = ClaudeMessageRequestSchema.safeParse(body);
    if (!parsedBody.success) {
      return new Response('Invalid request body', {
        status: 400
      });
    }

    const { newMessage, newConversationChannelId } = parsedBody.data;
    
    // Validation: Check conversation requirements
    if (!newConversationChannelId && !newMessage.conversationId) {
      return new Response('Message must either be part of an existing conversation, or a new conversation channel id needs to be provided', {
        status: 400
      });
    }

    if (newConversationChannelId && newMessage.conversationId) {
      return new Response('Cannot create a new conversation for a message sent for an existing conversationId', {
        status: 400
      });
    }

    if (newMessage.content.trim().length === 0) {
      return new Response('Message must contain non-whitespace content', {
        status: 400
      });
    }

    // Convert HTML to markdown
    try {
      const markdown = htmlToMarkdown(newMessage.content);
      newMessage.content = markdown;
    } catch (err) {
      return new Response(err.message ?? 'Unknown error when parsing message', {
        status: 500
      });
    }

    // Check again post-markdown conversion
    if (newMessage.content.trim().length === 0) {
      return new Response('Message must contain non-whitespace content', {
        status: 400
      });
    }

    // Validation: Check existing conversation ownership
    if (!newConversationChannelId && newMessage.conversationId) {
      const conversation = await context.loaders.LlmConversations.load(newMessage.conversationId);
      if (conversation?.userId !== currentUser._id) {
        return new Response(`Could not find user's conversation`, {
          status: 404
        });
      }
    }

    // All validation passed, now we can start streaming
    const encoder = new TextEncoder();
    let streamClosed = false;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const sendEventToClient = async (event: any) => {
            if (streamClosed) return;
            
            try {
              const data = `data: ${JSON.stringify(event)}\n\n`;
              controller.enqueue(encoder.encode(data));
            } catch (error) {
              // eslint-disable-next-line no-console
              console.error('Error sending event to client:', error);
            }
          };

          await sendLlmChatHandler({
            parsedBody: parsedBody.data,
            currentUser,
            context,
            sendEventToClient
          });

          controller.close();
        } catch (error) {
          // This catch block now only handles runtime streaming errors
          // All validation errors are handled above
          if (!streamClosed) {
            // eslint-disable-next-line no-console
            console.error('Error during streaming:', error);
          }
          controller.close();
        }
      },
      cancel() {
        streamClosed = true;
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    // Handle any unexpected errors (e.g., JSON parsing failures)
    // eslint-disable-next-line no-console
    console.error('Unexpected error in sendLlmChat:', error);
    return new Response('Internal server error', {
      status: 500
    });
  }
}