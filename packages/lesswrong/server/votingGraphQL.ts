import { addGraphQLSchema, addGraphQLResolvers, addGraphQLMutation } from '../lib/vulcan-lib/graphql';
import { performVoteServer, clearVotesServer } from './voteServer';
import { getCollection, getVoteableCollections } from './collections/allCollections';

export function createVoteableUnionType() {
  const voteableCollections = getVoteableCollections();
  const voteableSchema = voteableCollections.length ? `union Voteable = ${voteableCollections.map(collection => collection.typeName).join(' | ')}` : '';
  addGraphQLSchema(voteableSchema);
  
  for (let collection of voteableCollections)
    addVoteMutations(collection);
   
  
  return {}
}

const resolverMap = {
  Voteable: {
    __resolveType(obj: AnyBecauseTodo, context: AnyBecauseTodo, info: AnyBecauseTodo) {
      return obj.__typename;
    },
  },
};

addGraphQLResolvers(resolverMap);

addGraphQLMutation('vote(documentId: String, voteType: String, collectionName: String, voteId: String) : Voteable');

const voteResolver = {
  Mutation: {
    // vote: Voting mutation. Voting toggles, like the vote button UI: if the
    // given vote type is different from the user's previous vote, change to the
    // new vote type, but if it's the same as the user's previous vote, cancel
    // that vote.
    //
    // The voteId argument is ignored (we don't actually want to give clients
    // control over database IDs), but still exists as an option for legacy
    // compatibility.
    //
    // Returns the document that was voted upon, with its score updated.
    async vote(root: void, args: {documentId: string, voteType: DbVote['voteType'], collectionName: CollectionNameString, voteId?: string}, context: ResolverContext) {
      const {documentId, voteType, collectionName} = args;
      const { currentUser } = context;
      const collection = getCollection(collectionName);

      if (!collection) throw new Error("Error casting vote: Invalid collectionName");
      if (!collection.isVoteable()) throw new Error("Error casting vote: Collection is not voteable");
      if (!currentUser) throw new Error("Error casting vote: Not logged in.");

      const document = await performVoteServer({
        documentId, voteType: voteType||"neutral", collection, user: currentUser,
        toggleIfAlreadyVoted: true,
        skipRateLimits: false,
      });
      return document;
    },
    
  },
};

addGraphQLResolvers(voteResolver);

function addVoteMutations(collection: CollectionBase<VoteableCollectionName>) {
  // Add two mutations for voting on a given collection. `setVotePost` returns
  // a post with its scores/vote counts modified, and is provided for backwards
  // compatibility. `performVotePost` returns an object that looks like
  //   {
  //     updatedDocument: Post
  //     votingPatternsWarning: Bool!
  //   }
  const typeName = collection.typeName;
  const backCompatMutationName = `setVote${typeName}`;
  const mutationName = `performVote${typeName}`;
  
  addGraphQLMutation(`${backCompatMutationName}(documentId: String, voteType: String, extendedVote: JSON): ${typeName}`);
  addGraphQLMutation(`${mutationName}(documentId: String, voteType: String, extendedVote: JSON): VoteResult${typeName}`);
  addGraphQLSchema(`
    type VoteResult${typeName} {
      document: ${typeName}!
      showVotingPatternWarning: Boolean!
      
    }
  `);
  
  const performVoteMutation = async (args: {documentId: string, voteType: DbVote['voteType']|null, extendedVote?: any}, context: ResolverContext) => {
    const {documentId, voteType, extendedVote} = args;
    const {currentUser} = context;
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
  addGraphQLResolvers({
    Mutation: {
      [backCompatMutationName]: async (root: void, args: {documentId: string, voteType: DbVote['voteType']|null, extendedVote?: any}, context: ResolverContext) => {
        const {modifiedDocument, showVotingPatternWarning} = await performVoteMutation(args, context);
        return modifiedDocument;
      },
      [mutationName]: async (root: void, args: {documentId: string, voteType: DbVote['voteType']|null, extendedVote?: any}, context: ResolverContext) => {
        const {modifiedDocument, showVotingPatternWarning} = await performVoteMutation(args, context);
        return {
          document: modifiedDocument,
          showVotingPatternWarning,
        }
      },
    }
  });
}
