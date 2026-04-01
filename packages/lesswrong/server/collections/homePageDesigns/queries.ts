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
  if (userIsAdmin(context.currentUser)) return true;
  if (isDesignOwner(design, context)) return true;
  // Published designs are only accessible to non-owners if they've passed
  // the automated security review
  if (design.commentId && design.autoReviewPassed) return true;
  return false;
}

function filterDesignFields(design: DbHomePageDesign, context: ResolverContext): Partial<DbHomePageDesign> {
  const isOwner = isDesignOwner(design, context);
  const isAdmin = userIsAdmin(context.currentUser);
  if (isOwner || isAdmin) return design;
  // Strip conversationHistory for non-owners
  const { conversationHistory: _conversationHistory, autoReviewPassed: _autoReviewPassed, autoReviewMessage: _autoReviewMessage, ...rest } = design;
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

  // Returns the latest revision of each design (grouped by publicId),
  // ordered by most-recently-updated first.
  return context.repos.homePageDesigns.getLatestDesignsByOwner(ownerIds, limit);
}

async function homePageDesignSummariesResolver(
  root: void,
  _args: Record<string, never>,
  context: ResolverContext,
) {
  const { currentUser, clientId } = context;
  const ownerIds: string[] = [];
  if (currentUser) ownerIds.push(currentUser._id);
  if (clientId) ownerIds.push(clientId);
  if (ownerIds.length === 0) return [];

  return context.repos.homePageDesigns.getDesignSummariesByOwner(ownerIds);
}

async function marketplaceHomePageDesignsResolver(
  root: void,
  _args: Record<string, never>,
  _context: ResolverContext,
) {
  return _context.repos.homePageDesigns.getPublishedDesigns();
}

async function adminHomePageDesignsResolver(
  root: void,
  _args: Record<string, never>,
  context: ResolverContext,
) {
  if (!userIsAdmin(context.currentUser)) {
    throw new Error("Admin access required");
  }
  return context.repos.homePageDesigns.getDesignsForAdminReview();
}

export const graphqlHomePageDesignQueryTypeDefs = gql`
  type HomePageDesign ${ getAllGraphQLFields(schema) }

  type HomePageDesignSummary {
    publicId: String!
    title: String!
    createdAt: Date!
  }

  type MarketplaceHomePageDesign {
    publicId: String!
    title: String!
    html: String!
    verified: Boolean!
    commentBaseScore: Int!
  }

  type AdminHomePageDesign {
    _id: String!
    publicId: String!
    title: String!
    html: String!
    verified: Boolean!
    autoReviewPassed: Boolean
    autoReviewMessage: String
    createdAt: Date!
    source: String!
    modelName: String
    commentId: String
    ownerDisplayName: String!
    ownerSlug: String!
  }

  extend type Query {
    homePageDesignByPublicId(publicId: String!): HomePageDesign
    myHomePageDesigns(limit: Int): [HomePageDesign!]!
    myHomePageDesignSummaries: [HomePageDesignSummary!]!
    marketplaceHomePageDesigns: [MarketplaceHomePageDesign!]!
    adminHomePageDesigns: [AdminHomePageDesign!]!
  }

`;

export const homePageDesignGqlQueryHandlers = {
  homePageDesignByPublicId: homePageDesignByPublicIdResolver,
  myHomePageDesigns: homePageDesignsByOwnerResolver,
  myHomePageDesignSummaries: homePageDesignSummariesResolver,
  marketplaceHomePageDesigns: marketplaceHomePageDesignsResolver,
  adminHomePageDesigns: adminHomePageDesignsResolver,
};
export const homePageDesignGqlFieldResolvers = getFieldGqlResolvers('HomePageDesigns', schema);
