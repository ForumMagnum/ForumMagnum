import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createMcpServer } from "./mcpServer";
import { validateAccessToken, OAuthError } from "@/server/oauth/oauthProvider";
import { siteUrlSetting } from "@/lib/instanceSettings";
import type { NextRequest } from "next/server";

function getSiteUrl(): string {
  return siteUrlSetting.get().replace(/\/$/, "");
}

function unauthorized(description: string): Response {
  const siteUrl = getSiteUrl();
  return new Response(JSON.stringify({ error: "unauthorized", error_description: description }), {
    status: 401,
    headers: {
      "Content-Type": "application/json",
      "WWW-Authenticate": `Bearer resource="${siteUrl}/api/mcp"`,
    },
  });
}

async function handleMcpRequest(req: Request): Promise<Response> {
  // Extract and validate bearer token
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return unauthorized("Missing bearer token");
  }

  const bearerToken = authHeader.slice("Bearer ".length);
  let tokenInfo;
  try {
    tokenInfo = await validateAccessToken(bearerToken);
  } catch (e) {
    if (e instanceof OAuthError) {
      return unauthorized(e.message);
    }
    return unauthorized("Invalid token");
  }

  // Create a fresh server + transport per request
  const server = createMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  await server.connect(transport);

  // Handle the request, passing auth info
  const response = await transport.handleRequest(req, {
    authInfo: {
      token: bearerToken,
      clientId: tokenInfo.clientId,
      scopes: tokenInfo.scope.split(" ").filter(Boolean),
    },
  });

  return response;
}

export async function GET(req: NextRequest) {
  return handleMcpRequest(req);
}

export async function POST(req: NextRequest) {
  return handleMcpRequest(req);
}

export async function DELETE(req: NextRequest) {
  return handleMcpRequest(req);
}
