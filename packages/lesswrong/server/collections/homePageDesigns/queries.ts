import schema from "@/lib/collections/homePageDesigns/newSchema";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import HomePageDesigns from "@/server/collections/homePageDesigns/collection";
import gql from "graphql-tag";

function isDesignOwner(design: DbHomePageDesign, context: ResolverContext): boolean {
  const { currentUser, clientId } = context;
  if (currentUser && design.ownerId === currentUser._id) return true;
  if (clientId && design.ownerId === clientId) return true;
  return false;
}

function canAccessDesign(design: DbHomePageDesign, context: ResolverContext): boolean {
  if (design.commentId) return true; // published
  if (userIsAdmin(context.currentUser)) return true;
  return isDesignOwner(design, context);
}

function filterDesignFields(design: DbHomePageDesign, context: ResolverContext): Partial<DbHomePageDesign> {
  const isOwner = isDesignOwner(design, context);
  const isAdmin = userIsAdmin(context.currentUser);
  if (isOwner || isAdmin) return design;
  // Strip conversationHistory for non-owners
  const { conversationHistory: _, ...rest } = design;
  return rest;
}

async function homePageDesignByPublicIdResolver(
  root: void,
  { publicId }: { publicId: string },
  context: ResolverContext,
) {
  const design = await HomePageDesigns.findOne(
    { publicId },
    { sort: { createdAt: -1 } },
  );
  if (!design || !canAccessDesign(design, context)) return null;
  return filterDesignFields(design, context);
}

async function homePageDesignsByOwnerResolver(
  root: void,
  { limit }: { limit?: number },
  context: ResolverContext,
) {
  const { currentUser, clientId } = context;
  const ownerIds: string[] = [];
  if (currentUser) ownerIds.push(currentUser._id);
  if (clientId) ownerIds.push(clientId);
  if (ownerIds.length === 0) return [];

  const designs = await HomePageDesigns.find(
    { ownerId: { $in: ownerIds } },
    { sort: { createdAt: -1 }, ...(limit ? { limit } : {}) },
  ).fetch();

  // All results are owned by the caller, so access + field filtering is trivial
  return designs;
}

export const graphqlHomePageDesignQueryTypeDefs = gql`
  type HomePageDesign ${ getAllGraphQLFields(schema) }

  extend type Query {
    homePageDesignByPublicId(publicId: String!): HomePageDesign
    myHomePageDesigns(limit: Int): [HomePageDesign!]!
  }
`;

export const homePageDesignGqlQueryHandlers = {
  homePageDesignByPublicId: homePageDesignByPublicIdResolver,
  myHomePageDesigns: homePageDesignsByOwnerResolver,
};
export const homePageDesignGqlFieldResolvers = getFieldGqlResolvers('HomePageDesigns', schema);
