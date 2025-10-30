import UsersRepo from "@/server/repos/UsersRepo";
import type { NextRequest } from "next/server";
import { suggestedTimeouts } from "@/server/pageTimeouts";

export const maxDuration = suggestedTimeouts.simpleApiRoute;


export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.facetField || typeof body.facetField !== 'string' || !body.query || typeof body.query !== 'string') {
    return new Response("Invalid query", { status: 400 });
  }

  try {
    const repo = new UsersRepo();
    const hits = await repo.searchFacets(body.facetField, body.query);
    return new Response(JSON.stringify({ hits }), { status: 200 });  
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Search error:", e, JSON.stringify(e, null, 2));
    return new Response(e.message ?? "An error occurred", { status: 400 });
  }
}
