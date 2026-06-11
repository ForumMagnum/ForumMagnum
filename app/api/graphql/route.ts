import type { NextRequest } from "next/server";

import {
  GET as handleGraphqlGet,
  POST as handleGraphqlPost,
  OPTIONS as handleGraphqlOptions,
  maxDuration as graphqlMaxDuration,
} from "../../graphql/route";

export const maxDuration = graphqlMaxDuration;

export function GET(request: NextRequest) {
  return handleGraphqlGet(request);
}

export async function POST(request: NextRequest) {
  return handleGraphqlPost(request);
}

export function OPTIONS(request: NextRequest) {
  return handleGraphqlOptions(request);
}
