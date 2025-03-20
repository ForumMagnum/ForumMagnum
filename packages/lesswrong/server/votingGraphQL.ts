import { performVoteServer, clearVotesServer } from './voteServer';
import gql from 'graphql-tag';

const performVoteMutation = async (args: {documentId: string, voteType: DbVote['voteType']|null, extendedVote?: any}, context: ResolverContext, collectionName: VoteableCollectionName) => {
  const {documentId, voteType, extendedVote} = args;
  const {currentUser} = context;
  const collection: CollectionBase<VoteableCollectionName> = context[collectionName];
  const document = await collection.findOne({_id: documentId});
  
  if (!currentUser) throw new Error("Error casting vote: Not logged in.");
  if (!document) throw new Error("No such document ID"); 

  const {userCanVoteOn} = collection.options.voteable ?? {};
  const permissionResult = userCanVoteOn &&
    await userCanVoteOn(currentUser, document, voteType, extendedVote, context);
  if (permissionResult && permissionResult.fail) {
    throw new Error(permissionResult.reason);
  }

  if (!voteType && !extendedVote) {
    const modifiedDocument = await clearVotesServer({document, user: currentUser, collection, context});
    return { modifiedDocument, showVotingPatternWarning: false };
  } else {
    return await performVoteServer({
      toggleIfAlreadyVoted: false,
      document, voteType: voteType||"neutral", extendedVote, collection, user: currentUser,
      skipRateLimits: false,
      context,
    });
  }
}

export function getVoteGraphql(collectionName: VoteableCollectionName) {
  const typeName = collectionName;
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
