import { addCallback, addGraphQLSchema, addGraphQLResolvers, addGraphQLMutation } from './vulcan-lib';
import { performVoteServer } from './voteServer';
import { VoteableCollections } from '../lib/make_voteable';

function CreateVoteableUnionType() {
  const voteableSchema = VoteableCollections.length ? `union Voteable = ${VoteableCollections.map(collection => collection.typeName).join(' | ')}` : '';
  addGraphQLSchema(voteableSchema);
  return {}
}
addCallback('graphql.init.before', CreateVoteableUnionType);

const resolverMap = {
  Voteable: {
    __resolveType(obj, context, info){
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
    async vote(root, {documentId, voteType, collectionName, voteId}, context: ResolverContext) {
      const { currentUser } = context;
      const collection = context[collectionName];
      
      if (!collection) throw new Error("Error casting vote: Invalid collectionName");
      if (!currentUser) throw new Error("Error casting vote: Not logged in.");

      const document = await performVoteServer({documentId, voteType, collection, user: currentUser});
      return document;
    },
  },
};

addGraphQLResolvers(voteResolver);
