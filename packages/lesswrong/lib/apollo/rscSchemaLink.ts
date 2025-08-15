import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";
import { getUser } from "@/server/vulcan-lib/apollo-server/getUserFromReq";
import { SchemaLink } from "@apollo/client/link/schema";
import type { GraphQLSchema } from "graphql";

export const rscSchemaLink = (schema: GraphQLSchema) => {
  return new SchemaLink({ schema, context: async () => {
    const { cookies, headers } = await import("next/headers");

    const [cookieStore, headerValues] = await Promise.all([
      cookies(),
      headers(),
    ]);

    const user = await getUser(cookieStore.get("loginToken")?.value ?? null);

    const context = computeContextFromUser({
      user,
      cookies: cookieStore.getAll(),
      headers: headerValues,
      // We don't have easy access to the search params here
      // unless we pipe them through via e.g. the operation context
      // which is pretty annoying.  We only use them in one
      // place, though, which is the ckeditor link sharing key,
      // and we don't need to support that in an RSC context,
      // so it's safe to omit them for now.
      // searchParams: new URLSearchParams(searchParamsValues),
      isSSR: true,
    });

    return context;
  }});
};
