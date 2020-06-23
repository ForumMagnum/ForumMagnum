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
    async vote(root, {documentId, voteType, collectionName, voteId}, context: ResolverContext) {
      const { currentUser } = context;
      const collection = context[collectionName];
      
      if (!currentUser) throw new Error("Error casting vote: Not logged in.");

      const document = await performVoteServer({documentId, voteType, collection, voteId, user: currentUser});
      return document;
    },
  },
};

addGraphQLResolvers(voteResolver);
