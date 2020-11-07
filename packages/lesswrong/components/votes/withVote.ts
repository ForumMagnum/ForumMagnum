import { useState, useCallback } from 'react';
import { useMessages } from '../common/withMessages';
import { useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import { setVoteClient } from '../../lib/voting/vote';
import { getCollection, getFragmentText } from '../../lib/vulcan-lib';
import * as _ from 'underscore';
import { randomId } from '../../lib/random';
import { forumTypeSetting } from '../../lib/instanceSettings';

const getVoteMutationQuery = (collection: CollectionBase<DbObject>) => {
  const typeName = collection.options.typeName;
  const mutationName = `setVote${typeName}`;
  
  return gql`
    mutation ${mutationName}($documentId: String, $voteType: String) {
      ${mutationName}(documentId: $documentId, voteType: $voteType) {
        ...WithVote${typeName}
      }
    }
    ${getFragmentText(`WithVote${typeName}`)}
  `
}

export const useVote = <T extends VoteableTypeClient>(document: T, collectionName: CollectionNameString): {
  vote: (props: {document: T, voteType: string|null, collectionName: CollectionNameString, currentUser: UsersCurrent})=>void,
  collectionName: CollectionNameString,
  document: T,
  baseScore: number,
  voteCount: number,
} => {
  const messages = useMessages();
  const [optimisticResponseDocument, setOptimisticResponseDocument] = useState<any>(null);
  const collection = getCollection(collectionName);
  const query = getVoteMutationQuery(collection);
  const [mutate] = useMutation(query, {
    onCompleted: useCallback(() => {
      setOptimisticResponseDocument(null)
    }, []),
  });
  
  const vote = useCallback(async ({document, voteType, collectionName, currentUser}: {
    document: T, voteType: string|null, collectionName: CollectionNameString, currentUser: UsersCurrent
  }) => {
    const newDocument = await setVoteClient({collection, document, user: currentUser, voteType });

    try {
      void mutate({
        variables: {
          documentId: document._id,
          voteType,
        },
      })
      setOptimisticResponseDocument(newDocument);
    } catch(e) {
      const errorMessage = _.map(e.graphQLErrors, (gqlErr: any)=>gqlErr.message).join("; ");
      messages.flash({ messageString: errorMessage });
    }
  }, [messages, mutate, collection]);
  
  const af = forumTypeSetting.get() === 'AlignmentForum'
  const result = optimisticResponseDocument || document;
  return {
    vote, collectionName,
    document: result,
    baseScore: (af ? result.afBaseScore : result.baseScore) || 0,
    voteCount: (result.voteCount) || 0,
  };
}
