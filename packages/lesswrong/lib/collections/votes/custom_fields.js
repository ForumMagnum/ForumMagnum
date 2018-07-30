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

//
// Do a query, with a custom loader for query batching. This effectively does a
// find query, where all of the fields of the query are kept constant within a
// query batch except for one field, which is converted from looking for a
// specific value to being a {$in: [...]} query. The loader caches within one
// http request, and is reset between http requests.
//
//   collection: The collection which contains the objects you're querying for
//   loaderName: A key which identifies this loader. Calls to getWithLoader
//     that share a loaderName will be batched together, and must have an
//     identical baseQuery
//   groupByField: The name of the field whose value varies between queries in
//     the batch.
//   id: The value of the field whose values vary between queries in the batch.
//
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
            const votes = await getWithLoader(Votes, "votesByDocument", {}, "documentId", document._id)
            if (!votes.length) return [];
            return Users.restrictViewableFields(currentUser, Votes, votes);
          },
        }
      }
    },
    {
      fieldName: 'voteCount',
      fieldSchema: {
        type: Number,
        optional: true,
        viewableBy: ['guests'],
        resolveAs: {
          type: 'Int',
          resolver: async (document, args, { Users, Votes, currentUser }) => {
            const votes = await getWithLoader(Votes, "votesByDocument", {}, "documentId", document._id)
            return votes.length;
          }
        }
      }
    }
  ]);
});
