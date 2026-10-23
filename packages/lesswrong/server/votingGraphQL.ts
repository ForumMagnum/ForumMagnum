import { collectionNameToTypeName } from '@/lib/generated/collectionTypeNames';
import { accessFilterSingle } from '@/lib/utils/schemaUtils';
import gql from 'graphql-tag';

const performVoteMutation = async (args: {documentId: string, voteType: DbVote['voteType']|null, extendedVote?: any}, context: ResolverContext, collectionName: VoteableCollectionName) => {
  const { performVoteServer, clearVotesServer } = await import('./voteServer');
  const {documentId, voteType, extendedVote} = args;
  const {currentUser} = context;
  const collection: CollectionBase<VoteableCollectionName> = context[collectionName];
  const document = await collection.findOne({_id: documentId});
  
  if (!currentUser) throw new Error("Error casting vote: Not logged in.");
  // Documents the user can't see get the same error as nonexistent ones, so
  // that this can't be used to check whether a document exists.
  if (!document || !await accessFilterSingle(currentUser, collectionName, document, context)) {
    throw new Error("No such document ID");
  }

  const {userCanVoteOn} = collection.options.voteable ?? {};
  const permissionResult = userCanVoteOn &&
    await userCanVoteOn(currentUser, document, voteType, extendedVote, context);
  if (permissionResult && permissionResult.fail) {
    throw new Error(permissionResult.reason);
  }

  let showVotingPatternWarning = false;
  if (!voteType && !extendedVote) {
    await clearVotesServer({document, user: currentUser, collection, context});
  } else {
    ({ showVotingPatternWarning } = await performVoteServer({
      toggleIfAlreadyVoted: false,
      document, voteType: voteType||"neutral", extendedVote, collection, user: currentUser,
      skipRateLimits: false,
      context,
    }));
  }

  // Refetch rather than using the vote functions' returned document, which is
  // typed too loosely to permissions-filter. The new scores have already been
  // written to the database by this point.
  const updatedDocument = await collection.findOne({_id: documentId});
  const filteredDocument = await accessFilterSingle(currentUser, collectionName, updatedDocument, context);
  if (!filteredDocument) throw new Error("No such document ID");
  return { modifiedDocument: filteredDocument, showVotingPatternWarning };
}

export function getVoteGraphql(collectionName: VoteableCollectionName) {
  const typeName = collectionNameToTypeName[collectionName];
  const backCompatMutationName = `setVote${typeName}`;
  const mutationName = `performVote${typeName}`;

  const graphqlVoteTypeDefs = gql`
    type VoteResult${typeName} {
      document: ${typeName}!
      showVotingPatternWarning: Boolean!
    }
    extend type Mutation {
      ${backCompatMutationName}(documentId: String, voteType: String, extendedVote: JSON): ${typeName}
      ${mutationName}(documentId: String, voteType: String, extendedVote: JSON): VoteResult${typeName}
    }
  `;

  const graphqlVoteMutations = {
    [backCompatMutationName]: async (root: void, args: {documentId: string, voteType: DbVote['voteType']|null, extendedVote?: any}, context: ResolverContext) => {
      const {modifiedDocument, showVotingPatternWarning} = await performVoteMutation(args, context, collectionName);
      return modifiedDocument;
    },
    [mutationName]: async (root: void, args: {documentId: string, voteType: DbVote['voteType']|null, extendedVote?: any}, context: ResolverContext) => {
      const {modifiedDocument, showVotingPatternWarning} = await performVoteMutation(args, context, collectionName);
      return {
        document: modifiedDocument,
        showVotingPatternWarning,
      }
    },
  }
  
  return {
    graphqlVoteTypeDefs,
    graphqlVoteMutations,
  }
}
