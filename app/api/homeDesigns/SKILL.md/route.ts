import { HOME_DESIGN_SHARED_PROMPT } from "@/lib/homeDesignPrompt";
import { getSiteUrlFromReq } from "@/server/utils/getSiteUrl";
import { NextRequest } from "next/server";

function homeDesignSkillMarkdown(siteUrl: string): string {
  return `---
name: lesswrong-home-design
version: 1.0.0
description: Design custom home pages for LessWrong using HTML, CSS, and React rendered in a sandboxed iframe.
homepage: ${siteUrl}
---

LessWrong Home Page Design API
===============================

This skill allows you to create custom home page designs for LessWrong. Designs
are body-only HTML (with CSS and React/JSX) that run inside a sandboxed iframe
on the LessWrong home page.

If the user has given you a link to this skill but not specified an actual design,
ask them what they would like to design; don't just create a design without asking.

## Authentication

This API uses OAuth 2.0 with PKCE. You need to complete the OAuth flow once to
get an access token, then include it as a Bearer token in your API requests.

### Step 1: Discover OAuth endpoints

    GET ${siteUrl}/.well-known/oauth-authorization-server

This returns the authorization, token, and registration endpoints.

### Step 2: Register your client (one-time)

    POST ${siteUrl}/oauth/register
    Content-Type: application/json

    {
      "client_name": "My Design Agent",
      "redirect_uris": ["YOUR_CALLBACK_URL"]
    }

This returns a \`client_id\` and \`client_secret\`. Store these — you'll need them
for the token exchange.

### Step 3: Authorize

Open a browser to:

    ${siteUrl}/oauth/authorize?client_id=CLIENT_ID&redirect_uri=YOUR_CALLBACK_URL&response_type=code&scope=lesswrong:home-design&state=RANDOM_STATE&code_challenge=CHALLENGE&code_challenge_method=S256

The user will see a consent page and click "Allow". The browser redirects to
your callback URL with a \`code\` parameter.

For CLI agents, the callback URL is typically a local HTTP server
(e.g. \`http://localhost:PORT/callback\`). Both HTTPS and localhost HTTP are
accepted as redirect URIs.

PKCE is required. Generate a random \`code_verifier\` (43-128 characters), then
compute \`code_challenge = base64url(sha256(code_verifier))\`.

**Important:** The authorization redirect uses HTTP 307, which preserves the
original POST method. Your local callback server must handle both GET and POST
requests on the callback endpoint, or it will fail with a 501 error.

### Step 4: Exchange code for token

    POST ${siteUrl}/oauth/token
    Content-Type: application/x-www-form-urlencoded

    grant_type=authorization_code&code=AUTH_CODE&redirect_uri=YOUR_CALLBACK_URL&client_id=CLIENT_ID&client_secret=CLIENT_SECRET&code_verifier=CODE_VERIFIER

This returns an access token valid for 90 days.

### Reference: Complete OAuth Implementation (Python)

Below is a complete working implementation of the OAuth flow for CLI agents.
It starts a local callback server, generates PKCE values, opens the browser
for authorization, captures the code, and exchanges it for a token.

\`\`\`python
import secrets, hashlib, base64, urllib.parse, urllib.request, webbrowser, json
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading

SITE_URL = "${siteUrl}"
CALLBACK_PORT = 9876
REDIRECT_URI = f"http://localhost:{CALLBACK_PORT}/callback"

# --- PKCE ---
code_verifier = secrets.token_urlsafe(64)[:96]
code_challenge = (
    base64.urlsafe_b64encode(hashlib.sha256(code_verifier.encode()).digest())
    .rstrip(b"=")
    .decode()
)

# --- Register client ---
reg_data = json.dumps({
    "client_name": "My Design Agent",
    "redirect_uris": [REDIRECT_URI],
}).encode()
reg_req = urllib.request.Request(
    f"{SITE_URL}/oauth/register", data=reg_data,
    headers={"Content-Type": "application/json"},
)
reg = json.loads(urllib.request.urlopen(reg_req).read())
client_id = reg["client_id"]
client_secret = reg["client_secret"]

# --- Callback server (must handle both GET and POST due to 307 redirect) ---
auth_code = None

class CallbackHandler(BaseHTTPRequestHandler):
    def _handle(self):
        global auth_code
        params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        if self.command == "POST":
            body = self.rfile.read(int(self.headers.get("Content-Length", 0))).decode()
            params.update(urllib.parse.parse_qs(body))
        auth_code = params.get("code", [None])[0]
        self.send_response(200)
        self.send_header("Content-Type", "text/html")
        self.end_headers()
        self.wfile.write(b"<h1>Authorized! You can close this tab.</h1>")
        threading.Thread(target=self.server.shutdown).start()

    do_GET = _handle
    do_POST = _handle
    def log_message(self, *a): pass

server = HTTPServer(("localhost", CALLBACK_PORT), CallbackHandler)
threading.Thread(target=server.serve_forever).start()

# --- Open browser for authorization ---
state = secrets.token_urlsafe(16)
auth_url = (
    f"{SITE_URL}/oauth/authorize?"
    + urllib.parse.urlencode({
        "client_id": client_id,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": "lesswrong:home-design",
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
    })
)
webbrowser.open(auth_url)
server.serve_forever()  # blocks until callback received

# --- Exchange code for token ---
token_data = urllib.parse.urlencode({
    "grant_type": "authorization_code",
    "code": auth_code,
    "redirect_uri": REDIRECT_URI,
    "client_id": client_id,
    "client_secret": client_secret,
    "code_verifier": code_verifier,
}).encode()
token_req = urllib.request.Request(
    f"{SITE_URL}/oauth/token", data=token_data,
    headers={"Content-Type": "application/x-www-form-urlencoded"},
)
token_resp = json.loads(urllib.request.urlopen(token_req).read())
access_token = token_resp["access_token"]
print(f"Access token: {access_token}")
\`\`\`

**Key implementation notes:**
- The script uses only Python standard library modules (no \`pip install\` needed).
- The callback server must handle both GET and POST requests because the
  authorization redirect uses HTTP 307, which preserves the original method.
- PKCE \`code_verifier\` should be 43-128 URL-safe characters. The
  \`code_challenge\` is its SHA-256 hash, base64url-encoded with padding
  stripped.
- The callback server shuts itself down after receiving the code, so the
  script can proceed to the token exchange.

## Submitting a Design

    POST ${siteUrl}/api/homeDesigns
    Authorization: Bearer ACCESS_TOKEN
    Content-Type: application/json

    {
      "html": "<style>...</style><div id='root'></div><script type='text/babel' data-presets='react'>...</script>",
      "title": "My Custom Home Page",
      "modelName": "claude-opus-4.6",
      "publicId": null
    }

### Request fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| \`html\` | string | yes | Body content only — styles, HTML elements, and Babel script tags. See design reference below. |
| \`title\` | string | no | Name for the design. Defaults to "Untitled Design". |
| \`modelName\` | string | no | The model that generated this design (e.g. "claude-opus-4.6", "gpt-5.4"). |
| \`publicId\` | string | no | To update an existing design, pass its publicId. Omit or pass null to create a new one. |

### Response

    {
      "success": true,
      "publicId": "a1b2c3",
      "designId": "a1b2c3d4e5f6..."
    }

The \`publicId\` is a short identifier shared across all revisions of a design.
Use it in subsequent requests to update the same design.

## Previewing your design

After submitting, visit ${siteUrl} while logged in. Your most recent design
will be displayed in the home page iframe. You can also share the publicId
with the user so they can view it.

## Design Reference
${HOME_DESIGN_SHARED_PROMPT}
`;
}

export function GET(req: NextRequest) {
  const siteUrl = getSiteUrlFromReq(req);
  return new Response(homeDesignSkillMarkdown(siteUrl), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
