import { Votes } from "meteor/vulcan:voting";
import { addCallback } from 'meteor/vulcan:core';
import { VoteableCollections } from 'meteor/vulcan:voting';
import { Connectors } from 'meteor/vulcan:core'; // import from vulcan:lib because vulcan:core isn't loaded yet
import DataLoader from 'dataloader';


Votes.addField([
  {
    fieldName: "afPower",
    fieldSchema: {
      type: Number,
      optional: true,
      viewableBy: ['guests'],
    }
  }
]);

function invalidateVoteCaches(collection) {
  collection.votesByUser = null;
  collection.votesByDocument = null;
}

/*addCallback(`votes.new.sync`, (document, collection, user) => {
  invalidateVoteCaches(collection);
});

addCallback("votes.cancel.sync", (document, collection, user) => {
  invalidateVoteCaches(collection);
});*/

async function getWithLoader(collection, loaderName, baseQuery, groupByField, id)
{
  if (!collection.extraLoaders) {
    collection.extraLoaders = {};
  }
  if (!collection.extraLoaders[loaderName]) {
    collection.extraLoaders[loaderName] = new DataLoader(async docIDs => {
      let query = baseQuery ? _.clone(baseQuery) : {};
      query[groupByField] = { $in: docIDs };
      const queryResults = await Connectors.find(collection, query);
      const result = docIDs.map(id => _.where(queryResults, {[groupByField]: id}));
      return result;
    })
  }

  let result = await collection.extraLoaders[loaderName].load(id);
  return result;
}

VoteableCollections.forEach(collection => {
  // Replace currentUserVotes and allVotes with our own implementations. The
  // default implementations from vulcan-voting don't have batching, which makes
  // them veeeery slow when applied to votes on comments.
  collection.removeField("currentUserVotes");
  collection.removeField("allVotes");
  collection.addField([
    {
      fieldName: 'currentUserVotes',
      fieldSchema: {
        type: Array,
        optional: true,
        viewableBy: ['guests'],
        resolveAs: {
          type: '[Vote]',
          resolver: async (document, args, { Users, Votes, currentUser }) => {
            /*if (!currentUser) return [];
            const votes = await Connectors.find(Votes, {userId: currentUser._id, documentId: document._id});
            if (!votes.length) return [];
            return Users.restrictViewableFields(currentUser, Votes, votes);*/

            if (!currentUser) return [];
            const votes = await getWithLoader(Votes, `votesByUser${currentUser._id}`, {userId: currentUser._id}, "documentId", document._id);
            if (!votes.length) return [];
            return Users.restrictViewableFields(currentUser, Votes, votes);
          },
        }
      }
    },
    {
      fieldName: 'allVotes',
      fieldSchema: {
        type: Array,
        optional: true,
        viewableBy: ['guests'],
        resolveAs: {
          type: '[Vote]',
          resolver: async (document, args, { Users, Votes, currentUser }) => {
            /*if(!Votes.votesByDocument) {
              Votes.votesByDocument = new DataLoader(async docIDs => {
                const queryResults = await Connectors.find(Votes, { documentId: { $in: docIDs } });
                //const groupedQueryResults = _.groupBy(queryResults, doc=>doc.documentId);
                //return docIDs.map(id => groupedQueryResults[id] || []);
                return docIDs.map(id => _.where(queryResults, {documentId: id}));
              }, { cache: true })
            }
            const votes = await Votes.votesByDocument.load(document._id);*/

            const votes = await getWithLoader(Votes, "votesByDocument", {}, "documentId", document._id)
            if (!votes.length) return [];
            return Users.restrictViewableFields(currentUser, Votes, votes);
          },
        }
      }
    }
  ]);
});
