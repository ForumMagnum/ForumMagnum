import { resolveGraphiQLString } from "@/server/vulcan-lib/apollo-server/graphiql";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const htmlString = await resolveGraphiQLString(searchParams, { endpointURL: '/graphql' });

  return new Response(htmlString, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}
