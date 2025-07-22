import { NextRequest } from "next/server";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { construct405bPrompt } from "@/server/autocompleteEndpoint";
import { hyperbolicApiKey } from "@/lib/instanceSettings";
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

    // Construct the prompt
    const prompt = await construct405bPrompt(
      prefix,
      commentIds,
      postIds,
      user ?? currentUser,
      context,
      replyingCommentId,
      postId
    );

    // Make request to Hyperbolic API
    const url = 'https://api.hyperbolic.xyz/v1/completions';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hyperbolicApiKey.get()}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/Meta-Llama-3.1-405B',
        prompt,
        max_tokens: 256,
        temperature: 0.7,
        top_p: 0.9,
        stream: true,
        frequency_penalty: 0.5
      }),
    });

    if (!response.ok || !response.body) {
      return new Response(`Error from API: ${response.statusText}`, {
        status: response.status,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // Forward the streaming response from Hyperbolic API
    const reader = response.body.getReader();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              controller.close();
              break;
            }

            // Forward the chunk as-is (Hyperbolic API already formats it as SSE)
            controller.enqueue(value);
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error reading from Hyperbolic stream:', error);
          controller.error(error);
        }
      },
      cancel() {
        reader.cancel();
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
    console.error('Unexpected error in autocomplete405b:', error);
    return new Response(JSON.stringify({ error: "An error occurred during autocomplete" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
