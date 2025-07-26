import { NextRequest } from "next/server";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { getAnthropicPromptCachingClientOrThrow } from "@/server/languageModels/anthropicClient";
import { constructMessageHistory } from "@/server/autocompleteEndpoint";
import { z } from "zod";

const AutocompleteRequestSchema = z.object({
  prefix: z.string().optional().default(''),
  commentIds: z.array(z.string()).optional().default([]),
  postIds: z.array(z.string()).optional().default([]),
  replyingCommentId: z.string().optional(),
  postId: z.string().optional(),
  userId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Get context and validate user
    const [body, context] = await Promise.all([
      req.json(),
      getContextFromReqAndRes({ req, isSSR: false })
    ]);

    const currentUser = context.currentUser;
    if (!currentUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!userIsAdmin(currentUser)) {
      return new Response(JSON.stringify({ error: "Claude Completion is for admins only" }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate request body
    const parseResult = AutocompleteRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return new Response(JSON.stringify({ 
        error: "Invalid request body", 
        details: parseResult.error.errors 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { 
      prefix,
      commentIds,
      postIds,
      replyingCommentId, 
      postId, 
      userId 
    } = parseResult.data;

    // Load user if userId is provided
    const user = userId ? await context.loaders.Users.load(userId) : undefined;

    // Create the streaming response
    const encoder = new TextEncoder();
    let streamClosed = false;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const client = getAnthropicPromptCachingClientOrThrow();

          // Construct message history
          const messages = await constructMessageHistory(
            prefix,
            commentIds,
            postIds,
            user ?? currentUser,
            context,
            replyingCommentId,
            postId
          );

          // Create the Claude stream
          const loadingMessagesStream = client.messages.stream({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1000,
            system: "The assistant is in CLI simulation mode, and responds to the user's CLI commands only with the output of the command.",
            messages,
          });

          loadingMessagesStream.on("text", (delta) => {
            if (streamClosed) return;
            
            try {
              const data = `data: ${JSON.stringify({ type: "text", content: delta })}\n\n`;
              controller.enqueue(encoder.encode(data));
            } catch (error) {
              // eslint-disable-next-line no-console
              console.error('Error sending text chunk:', error);
            }
          });

          loadingMessagesStream.on("end", () => {
            if (streamClosed) return;
            
            try {
              const data = `data: ${JSON.stringify({ type: "end" })}\n\n`;
              controller.enqueue(encoder.encode(data));
            } catch (error) {
              // eslint-disable-next-line no-console
              console.error('Error sending end event:', error);
            }
            controller.close();
          });

          loadingMessagesStream.on("error", (error) => {
            console.error("Stream error:", JSON.stringify(error));
            
            if (!streamClosed) {
              try {
                const data = `data: ${JSON.stringify({ type: "error", message: "An error occurred" })}\n\n`;
                controller.enqueue(encoder.encode(data));
              } catch (e) {
                // eslint-disable-next-line no-console
                console.error('Error sending error event:', e);
              }
            }
            controller.close();
          });

        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Autocomplete error:", error);
          
          if (!streamClosed) {
            try {
              const data = `data: ${JSON.stringify({ 
                type: "error", 
                message: error instanceof Error ? error.message : "An error occurred during autocomplete" 
              })}\n\n`;
              controller.enqueue(encoder.encode(data));
            } catch (e) {
              // eslint-disable-next-line no-console
              console.error('Error sending error event:', e);
            }
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
    console.error('Unexpected error in autocomplete:', error);
    return new Response(JSON.stringify({ error: "An error occurred during autocomplete" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}